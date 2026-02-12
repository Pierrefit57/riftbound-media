UPDATE calendar_events SET type = 'Tournoi' WHERE type = 'tournament';
UPDATE calendar_events SET type = 'Stream' WHERE type = 'stream';
UPDATE calendar_events SET type = 'Mise à jour' WHERE type = 'patch';
UPDATE calendar_events SET type = 'Communauté' WHERE type = 'community';
