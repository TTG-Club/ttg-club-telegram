import * as mongoose from 'mongoose';

const spellSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    aliases: {
        type: Array,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    school: {
        type: String,
        required: true
    },
    castingTime: {
        type: String,
        required: true
    },
    range: {
        type: String,
        required: true
    },
    materials: {
        type: String,
        required: true
    },
    components: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    ritual: {
        type: String,
        required: false
    }
});

export const Spell = mongoose.model('Spell', spellSchema);

export default { Spell }
