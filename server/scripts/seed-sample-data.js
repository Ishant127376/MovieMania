import '../src/config/loadEnv.js';

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sampleDataPath = join(__dirname, '../../sample-data/sample-mongodb-data.json');

const sampleData = JSON.parse(readFileSync(sampleDataPath, 'utf-8'));

const normalizeMongoUri = (value) => {
    if (!value) return value;
    let normalized = value.trim();

    if (normalized.startsWith('MONGODB_URI=')) {
        normalized = normalized.slice('MONGODB_URI='.length).trim();
    }

    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))) {
        normalized = normalized.slice(1, -1).trim();
    }

    return normalized;
};

const MONGODB_URI = normalizeMongoUri(process.env.MONGODB_URI) || 'mongodb://localhost:27017/moviemania';

function redactMongoUri(uri) {
    try {
        // Handles mongodb+srv:// and mongodb://
        const hasScheme = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
        if (!hasScheme) return uri;

        const [scheme, rest] = uri.split('://');
        // rest = "user:pass@host/..." or "host/..."
        const atIdx = rest.indexOf('@');
        if (atIdx === -1) return uri;

        const creds = rest.slice(0, atIdx);
        const after = rest.slice(atIdx + 1);

        const hasColon = creds.includes(':');
        const redactedCreds = hasColon ? `${creds.split(':')[0]}:***` : '***';
        return `${scheme}://${redactedCreds}@${after}`;
    } catch {
        return uri;
    }
}

// Define schemas (simplified for seeding)
const userSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const movieSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const tvShowSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const episodeSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const watchlistMovieSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const watchlistTVShowSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const collectionSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

// Models
const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);
const TVShow = mongoose.model('TVShow', tvShowSchema);
const Episode = mongoose.model('Episode', episodeSchema);
const WatchlistMovie = mongoose.model('WatchlistMovie', watchlistMovieSchema);
const WatchlistTVShow = mongoose.model('WatchlistTVShow', watchlistTVShowSchema);
const Collection = mongoose.model('Collection', collectionSchema);

function convertIds(data, idFields = ['_id', 'addedBy', 'createdBy']) {
    return data.map((item) => {
        const converted = { ...item };

        idFields.forEach((field) => {
            if (converted[field] && typeof converted[field] === 'string') {
                converted[field] = new mongoose.Types.ObjectId(converted[field]);
            }
        });

        if (converted.userRatings) {
            converted.userRatings = converted.userRatings.map((rating) => ({
                ...rating,
                userId: new mongoose.Types.ObjectId(rating.userId),
            }));
        }

        if (converted.movies && Array.isArray(converted.movies)) {
            converted.movies = converted.movies.map((m) => ({
                ...m,
                movie: new mongoose.Types.ObjectId(m.movie),
            }));
        }

        return converted;
    });
}

async function seedDatabase() {
    console.log('🌱 MovieMania Database Seeder (Sample Data)\n');
    console.log(`📦 Connecting to: ${redactMongoUri(MONGODB_URI)}\n`);

    try {
        const hasDbInUriPath = /mongodb(\+srv)?:\/\/[^/]+\/[^?]+/.test(MONGODB_URI);
        await mongoose.connect(MONGODB_URI, {
            ...(hasDbInUriPath ? {} : { dbName: process.env.MONGODB_DB_NAME || 'moviemania' }),
        });

        console.log('✅ Connected to MongoDB\n');
        console.log('⚠️  WARNING: This will DELETE all existing data in these collections!\n');

        console.log('🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Movie.deleteMany({}),
            TVShow.deleteMany({}),
            Episode.deleteMany({}),
            WatchlistMovie.deleteMany({}),
            WatchlistTVShow.deleteMany({}),
            Collection.deleteMany({}),
        ]);
        console.log('✅ Cleared all collections\n');

        console.log('📥 Inserting sample data...\n');

        const users = convertIds(sampleData.users);
        await User.insertMany(users);
        console.log(`   ✅ Users: ${users.length} documents`);

        const movies = convertIds(sampleData.movies);
        await Movie.insertMany(movies);
        console.log(`   ✅ Movies: ${movies.length} documents`);

        const tvshows = convertIds(sampleData.tvshows);
        await TVShow.insertMany(tvshows);
        console.log(`   ✅ TV Shows: ${tvshows.length} documents`);

        const episodes = convertIds(sampleData.episodes, ['_id']);
        await Episode.insertMany(episodes);
        console.log(`   ✅ Episodes: ${episodes.length} documents`);

        const watchlistMovies = convertIds(sampleData.watchlistmovies);
        await WatchlistMovie.insertMany(watchlistMovies);
        console.log(`   ✅ Watchlist Movies: ${watchlistMovies.length} documents`);

        const watchlistTVShows = convertIds(sampleData.watchlisttvshows);
        await WatchlistTVShow.insertMany(watchlistTVShows);
        console.log(`   ✅ Watchlist TV Shows: ${watchlistTVShows.length} documents`);

        const collections = convertIds(sampleData.collections, ['_id', 'createdBy']);
        await Collection.insertMany(collections);
        console.log(`   ✅ Collections: ${collections.length} documents`);

        console.log('\n🎉 Database seeded successfully!\n');
        console.log('Next: open Atlas → Data Explorer → browse the moviemania database.');
    } catch (error) {
        console.error('❌ Error seeding database:', error?.message || error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

await seedDatabase();
