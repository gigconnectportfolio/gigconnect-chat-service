import {ConversationModel} from "../models/conversation.schema";
import {IMessageDetails, IMessageDocument} from "@kariru-k/gigconnect-shared";
import {MessageModel} from "../models/message.schema";
import {publishDirectMessage} from "../queues/message.producer";
import {chatChannel, socketIOChatObject} from "../server";


/**
 * This function creates a new conversation between two users. It takes in the conversation ID,
 * sender's username, and receiver's username as parameters and saves the conversation to the database.
 * @param {string} conversationId - The unique identifier for the conversation.
 * @param {string} senderUsername - The username of the user who is sending messages in the conversation.
 * @param {string} receiverUsername - The username of the user who is receiving messages in the conversation.
 */
export const createConversation = async (conversationId: string, senderUsername: string, receiverUsername: string): Promise<void> => {
    await ConversationModel.create({
        conversationId: conversationId,
        senderUsername: senderUsername,
        receiverUsername: receiverUsername
    });
};

/**
 * This function adds a new message to the database and emits it to connected clients via Socket.IO.
 * If the message contains an offer, it also publishes a message to a RabbitMQ exchange for email notifications.
 * @param {IMessageDocument} data - The message data to be added to the database.
 * @returns {Promise<IMessageDocument>} - The newly created message document.
 */
export const addMessage = async (data: IMessageDocument): Promise<IMessageDocument> => {
    const message: IMessageDocument = await MessageModel.create(data) as IMessageDocument;

    if (data.hasOffer){
        const emailMessageDetails: IMessageDetails = {
            sender: data.senderUsername,
            amount: data.offer?.price.toString(),
            buyerUsername: data.receiverUsername?.toLowerCase(),
            sellerUsername: data.senderUsername?.toLowerCase(),
            title: data.offer?.gigTitle,
            description: data.offer?.description,
            deliveryDays: `${data.offer?.deliveryDays}`,
            template: 'offer'
        };

        await publishDirectMessage(
            chatChannel,
            'gigconnect-order-exchange',
            'order-email',
            JSON.stringify(emailMessageDetails),
            'Order email sent to notification service'
        );
    }

    socketIOChatObject.emit('message received', message);

    return message;
}

