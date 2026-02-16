
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

async function scanAllTables() {
    console.log('--- Scan Exhaustif de la Base de Données ---');

    // Tenter de lister les tables via une requête sur information_schema (nécessite permissions élevées ou RPC)
    // Étant donné que nous sommes via le service_role, nous pouvons essayer d'interroger information_schema via une ruse ou simplement tester les tables probables.

    // Mais le plus simple est de demander à Supabase de compter les lignes pour chaque table qu'il connaît dans le schéma public.
    // Malheureusement supabase-js ne permet pas de lister les tables directement sans RPC.

    // Testons d'autres tables classiques de Supabase ou liées au projet
    const suspectTables = [
        'articles', 'profiles', 'analytics_logs', 'calendar_events',
        'realtime', 'objects', 'buckets', 'schema_migrations'
    ];

    // On va aussi essayer de voir si on peut appeler une fonction SQL personnalisée si elle existe
    console.log('Vérification des tables connues...');
    for (const table of suspectTables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            if (!error) console.log(`Table [${table}] : ${count} lignes`);
        } catch (e) { }
    }

    console.log('\n--- Vérification du Schéma "storage" ---');
    try {
        const { count, error } = await supabase
            .from('objects')
            .select('*', { count: 'exact', head: true })
            .schema('storage');
        if (!error) console.log(`storage.objects : ${count} fichiers référencés`);
        else console.log('Impossible de lire storage.objects directement.');
    } catch (e) { }

    console.log('\n--- Conclusion Probable ---');
    console.log('Si toutes les tables sont petites, le poids de 5 Go peut venir de :');
    console.log('1. Des fichiers supprimés mais non purgés physiquement par Supabase (soft delete?).');
    console.log('2. Des index massifs (peu probable avec si peu de lignes).');
    console.log('3. Les logs de plateforme (Log Explorer) ou les backups qui s\'accumulent.');
    console.log('4. Un autre projet Supabase lié au même compte ?');

    console.log('\n💡 CONSEIL : Allez dans Settings > Billing > Project Usage sur le site Supabase pour voir exactement quel poste (Database, Storage, Transfer) pèse 5 Go.');
}

scanAllTables();
