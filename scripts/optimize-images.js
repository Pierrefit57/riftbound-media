
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Détection du mode Dry Run via l'argument --dry-run
const DRY_RUN = process.argv.includes('--dry-run');

if (!supabaseUrl || !supabaseKey) {
    console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être dans le .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'article-images';
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 Mo ou si ce n'est pas déjà du webp

async function optimizeImages() {
    console.log('--- Démarrage de l\'optimisation des images ---');
    if (DRY_RUN) {
        console.log('⚠️  MODE SIMULATION (DRY RUN) ACTIVÉ.');
    }

    // 1. Lister tous les fichiers avec pagination
    let allFiles = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
        const { data: files, error: listError } = await supabase.storage.from(BUCKET).list('articles', {
            limit,
            offset,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (listError) {
            console.error('Erreur lors du listing:', listError);
            return;
        }

        allFiles = allFiles.concat(files);
        if (files.length < limit) {
            hasMore = false;
        } else {
            offset += limit;
        }
    }

    console.log(`${allFiles.length} fichiers trouvés.`);

    let totalSaved = 0;
    let processed = 0;

    for (const file of allFiles) {
        const filePath = `articles/${file.name}`;
        const isWebp = file.name.toLowerCase().endsWith('.webp');
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

        if (!isImage) {
            console.log(`[SKIP] ${file.name} n'est pas une image supportée.`);
            continue;
        }

        // On optimise si > 1Mo OU si ce n'est pas du Webp
        if (file.metadata.size < MAX_SIZE_BYTES && isWebp) {
            // console.log(`[PASS] ${file.name} est déjà optimisé.`);
            continue;
        }

        console.log(`[TRAITEMENT] ${file.name} (${(file.metadata.size / 1024).toFixed(2)} Ko)...`);

        try {
            // 2. Télécharger
            const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(filePath);
            if (downloadError) throw downloadError;

            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 3. Compresser avec Sharp
            const optimizedBuffer = await sharp(buffer)
                .resize(1200, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const newSize = optimizedBuffer.length;
            const savedSize = file.metadata.size - newSize;
            totalSaved += Math.max(0, savedSize);

            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newPath = `articles/${newFileName}`;

            if (DRY_RUN) {
                console.log(`[SIMULATION] Gain estimé: ${(savedSize / 1024).toFixed(2)} Ko | Nouveau fichier: ${newFileName}`);
                processed++;
                continue;
            }

            // 4. Re-uploader
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(newPath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true,
                cacheControl: '31536000'
            });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            // 5. Mise à jour de la BDD
            // On le fait même si le nom ne change pas (ex: .webp -> .webp plus petit) pour être sûr du cacheControl

            // Obtenir les URLs
            const { data: { publicUrl: oldUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
            const { data: { publicUrl: newUrl } = { publicUrl: null } } = supabase.storage.from(BUCKET).getPublicUrl(newPath); // Handle case where newUrl might be null

            // Mise à jour image_url
            const { error: dbError1 } = await supabase
                .from('articles')
                .update({ image_url: newUrl })
                .eq('image_url', oldUrl);

            if (dbError1) console.error(`[DB ERROR] Mise à jour image_url pour ${file.name}:`, dbError1.message);

            // Mise à jour content
            const { data: articles, error: selectError } = await supabase
                .from('articles')
                .select('id, content')
                .ilike('content', `%${file.name}%`);

            if (selectError) console.error(`[DB ERROR] Sélection articles pour ${file.name}:`, selectError.message);

            if (articles && articles.length > 0) {
                for (const article of articles) {
                    const updatedContent = article.content
                        .split(oldUrl).join(newUrl)
                        .split(file.name).join(newFileName);

                    const { error: updateContentError } = await supabase
                        .from('articles')
                        .update({ content: updatedContent })
                        .eq('id', article.id);

                    if (updateContentError) console.error(`[DB ERROR] Mise à jour content pour article ${article.id}:`, updateContentError.message);
                }
                console.log(`[DB] Références mises à jour dans ${articles.length} articles.`);
            }

            // 6. Supprimer l'original SI le nom a changé
            if (file.name !== newFileName) {
                const { error: deleteError } = await supabase.storage.from(BUCKET).remove([filePath]);
                if (deleteError) console.error(`[CLEANUP ERROR] Suppression de ${file.name}:`, deleteError.message);
                else console.log(`[CLEANUP] Supprimé: ${file.name}`);
            }

            console.log(`[DONE] ${newFileName} (Gain: ${(savedSize / 1024).toFixed(2)} Ko)`);
            processed++;

        } catch (err) {
            console.error(`[ERROR] ${file.name}:`, err.message);
        }
    }

    console.log('\n--- TERMINÉ ---');
    console.log(`Fichiers traités: ${processed}`);
    console.log(`Gain de stockage total: ${(totalSaved / 1024 / 1024).toFixed(2)} Mo`);
    if (DRY_RUN) console.log('⚠️ Aucune modification réelle n\'a été faite.');
}

optimizeImages();
