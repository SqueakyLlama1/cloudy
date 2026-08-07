import * as mongoose from 'mongoose';

const LevelSchema = new mongoose.Schema(
    {
        created: { type: Date, required: true },
        level: { type: Number, default: 0 },
        accountId: { type: Number, required: true, unique: true },
        levelProgress: { type: Number, default: 0 },
    },
    {
        collection: "levels"
    }
);

const Level = mongoose.model("Level", LevelSchema);

export default Level;