
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

async function checkDatabase() {
    console.log('--- Analyse de la Base de Données ---');

    const tables = ['articles', 'profiles', 'analytics_logs', 'calendar_events'];

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`Erreur sur la table ${table}:`, error.message);
        } else {
            console.log(`Table [${table}] : ${count} lignes`);
        }
    }

    // Essayer de voir si on peut avoir des stats de taille via une requête directe (nécessite des permissions RPC si définies)
    console.log('\nNote: L\'estimation de la taille disque précise nécessite généralement un accès direct SQL (pg_total_relation_size).');
    console.log('Si "analytics_logs" a des millions de lignes, c\'est le coupable.');

    console.log('\n--- Fin de l\'analyse ---');
}

checkDatabase();
