import * as mongoose from 'mongoose';

const LevelSchema = new mongoose.Schema(
    {
        created: { type: Date, required: true },
        level: { type: Number, default: 0 },
        accountId: { type: String, required: true, unique: true },
        levelProgress: { type: Number, default: 0 },
    },
    {
        collection: "levels"
    }
);

const L = mongoose.model("Level", LevelSchema);

export default Level;