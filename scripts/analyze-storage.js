
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être dans le .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scanBucket(bucketName, path = '') {
    let totalSize = 0;
    let fileCount = 0;

    const { data: items, error } = await supabase.storage.from(bucketName).list(path, {
        limit: 100,
        offset: 0
    });

    if (error) {
        console.error(`Erreur scan bucket ${bucketName}/${path}:`, error.message);
        return { size: 0, count: 0 };
    }

    for (const item of items) {
        if (item.id === null) {
            // C'est un dossier
            const subPath = path ? `${path}/${item.name}` : item.name;
            const subScan = await scanBucket(bucketName, subPath);
            totalSize += subScan.size;
            fileCount += subScan.count;
        } else {
            // C'est un fichier
            totalSize += item.metadata.size || 0;
            fileCount += 1;
        }
    }

    return { size: totalSize, count: fileCount };
}

async function analyze() {
    console.log('--- Analyse Globale du Stockage Supabase ---');

    // 1. Lister les buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
        console.error('Erreur listing buckets:', bucketError);
        return;
    }

    console.log(`${buckets.length} buckets trouvés.\n`);

    let globalTotal = 0;

    for (const bucket of buckets) {
        process.stdout.write(`Scan du bucket [${bucket.name}]... `);
        const { size, count } = await scanBucket(bucket.name);
        globalTotal += size;
        console.log(`${(size / 1024 / 1024).toFixed(2)} Mo (${count} fichiers)`);
    }

    console.log('\n--- Résumé Storage ---');
    console.log(`TOTAL STORAGE : ${(globalTotal / 1024 / 1024).toFixed(2)} Mo (${(globalTotal / 1024 / 1024 / 1024).toFixed(2)} Go)`);

    if (globalTotal < 100 * 1024 * 1024) {
        console.log('\n⚠️ Le storage semble vide ou très léger. Le problème vient peut-être de la BASE DE DONNÉES.');
        console.log('Vérifiez la table "analytics_logs" ou "profiles" dans le dashboard Supabase (Usage > Database).');
    }

    console.log('\n--- Fin de l\'analyse ---');
}

analyze();
