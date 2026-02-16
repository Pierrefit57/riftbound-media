
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être dans le .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'article-images';
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 Mo

async function optimizeImages() {
    console.log('--- Démarrage de l\'optimisation des images ---');

    // 1. Lister les fichiers
    const { data: files, error: listError } = await supabase.storage.from(BUCKET).list('articles', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
    });

    if (listError) {
        console.error('Erreur lors du listing:', listError);
        return;
    }

    console.log(`${files.length} fichiers trouvés.`);

    for (const file of files) {
        const filePath = `articles/${file.name}`;

        // Ignorer si déjà petit ou déjà webp (sauf si forcé)
        if (file.metadata.size < MAX_SIZE_BYTES && file.name.endsWith('.webp')) {
            console.log(`[PASS] ${file.name} est déjà optimisé.`);
            continue;
        }

        if (file.metadata.size < MAX_SIZE_BYTES && !file.name.endsWith('.webp')) {
            console.log(`[INFO] ${file.name} est petit mais pas en webp. Compression...`);
        } else {
            console.log(`[OPTIMIZE] ${file.name} (${(file.metadata.size / 1024 / 1024).toFixed(2)} Mo)`);
        }

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

            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newPath = `articles/${newFileName}`;

            // 4. Re-uploader
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(newPath, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

            if (uploadError) throw uploadError;
            console.log(`[SUCCESS] Uploadé: ${newFileName}`);

            // 5. Mise à jour de la BDD si le nom a changé
            if (file.name !== newFileName) {
                console.log(`[DB] Mise à jour des références pour ${file.name} -> ${newFileName}`);

                // Obtenir l'ancienne et la nouvelle URL publique
                const { data: { publicUrl: oldUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
                const { data: { publicUrl: newUrl } } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

                // Mise à jour de la colonne image_url
                const { error: dbError1 } = await supabase
                    .from('articles')
                    .update({ image_url: newUrl })
                    .eq('image_url', oldUrl);

                if (dbError1) console.error('Erreur MAJ image_url:', dbError1);

                // Mise à jour du contenu (Markdown)
                // On récupère tous les articles qui pourraient contenir l'ancienne URL
                const { data: articles } = await supabase
                    .from('articles')
                    .select('id, content')
                    .ilike('content', `%${file.name}%`);

                if (articles) {
                    for (const article of articles) {
                        const updatedContent = article.content.split(oldUrl).join(newUrl).split(file.name).join(newFileName);
                        const { error: dbError2 } = await supabase
                            .from('articles')
                            .update({ content: updatedContent })
                            .eq('id', article.id);
                        if (dbError2) console.error(`Erreur MAJ content pour article ${article.id}:`, dbError2);
                    }
                }

                // 6. Supprimer l'original
                const { error: deleteError } = await supabase.storage.from(BUCKET).remove([filePath]);
                if (deleteError) console.error(`Erreur suppression ${file.name}:`, deleteError);
                else console.log(`[DELETE] Supprimé original: ${file.name}`);
            }

        } catch (err) {
            console.error(`[ERROR] Erreur sur ${file.name}:`, err.message);
        }
    }

    console.log('--- Fin de l\'optimisation ---');
}

optimizeImages();
