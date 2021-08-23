import * as mongoose from 'mongoose';
import BSON from 'bson';

const metricsSchema = new mongoose.Schema({
    _id: {
        type: BSON.ObjectId,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    users: {
        type: Array,
        required: true
    },
    spellCount: {
        type: Number,
        required: true
    }
}, {
    collection: 'metrics'
});

export const MetricsModel = mongoose.model('Metrics', metricsSchema);

export default { MetricsModel }
