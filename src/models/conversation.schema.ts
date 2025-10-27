import {model, Model, Schema} from "mongoose";
import {IConversationDocument} from "@kariru-k/gigconnect-shared";

const conversationSchema: Schema = new Schema({
    conversationId: {type: String, required: true, unique: true, index: true},
    senderUsername: {type: String, required: true, index: true},
    receiverUsername: {type: String, required: true, index: true},
});

const ConversationModel: Model<IConversationDocument> = model<IConversationDocument>('Conversation', conversationSchema, 'Conversation');
export {ConversationModel};
