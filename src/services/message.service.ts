import {ConversationModel} from "../models/conversation.schema";
import {IConversationDocument, IMessageDetails, IMessageDocument} from "@kariru-k/gigconnect-shared";
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

/**
 * This function retrieves the conversation between two users from the database
 * It takes in the sender's username and receiver's username as parameters and returns the conversation documents.
 * @param {string} sender - The username of the user who is sending messages in the conversation.
 * @param {string} receiver - The username of the user who is receiving messages in the conversation.
 * @returns {Promise<IConversationDocument[]>} - An array of conversation documents between the two users.
 */
export const getConversation = async (sender: string, receiver: string): Promise<IConversationDocument[]> => {
    const query = {
        $or: [
            { senderUsername: sender, receiverUsername: receiver },
            { senderUsername: receiver, receiverUsername: sender }
        ]
    };

    return ConversationModel.aggregate([{$match: query}]);
}

/**
 * This function retrieves the list of conversations for a specific user from the database.
 * It takes in the username as a parameter and returns the latest message from each conversation involving that user.
 * The conversations are grouped by conversation ID and sorted by creation date in descending order. Important for conversation list view.
 * @param {string} username - The username of the user whose conversation list is to be retrieved.
 * @returns {Promise<IMessageDocument[]>} - An array of message documents representing the latest message from each conversation.
 */
export const getUserConversationList = async (username: string): Promise<IMessageDocument[]> => {
    const query = {
        $or: [
            { senderUsername: username },
            { receiverUsername: username }
        ]
    };

    return MessageModel.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: "$conversationId",
                result: {
                    $top: {
                        output: "$$ROOT",
                        sortBy: { createdAt: -1 }
                    }
                }
            }
        },
        {
            $project: {
                _id: '$result._id',
                conversationId: '$result.conversationId',
                sellerId: '$result.sellerId',
                buyerId: '$result.buyerId',
                receiverUsername: '$result.receiverUsername',
                receiverPicture: '$result.receiverPicture',
                senderUsername: '$result.senderUsername',
                senderPicture: '$result.senderPicture',
                body: '$result.body',
                file: '$result.file',
                gigId: '$result.gigId',
                isRead: '$result.isRead',
                hasOffer: '$result.hasOffer',
                createdAt: '$result.createdAt',
            }
        }
    ]);
}

/**
 * This function retrieves all messages exchanged between two users from the database.
 * It takes in the sender's username and receiver's username as parameters and returns the message documents, sorted by creation date in ascending order.
 * @param {string} sender - The username of the user who is sending messages.
 * @param {string} receiver - The username of the user who is receiving messages.
 * @returns {Promise<IMessageDocument[]>} - An array of message documents exchanged between the two users.
 */
export const getMessages = async (sender: string, receiver: string): Promise<IMessageDocument[]> => {
    const query = {
        $or: [
            { senderUsername: sender, receiverUsername: receiver },
            { senderUsername: receiver, receiverUsername: sender }
        ]
    };

    return MessageModel.aggregate([{$match: query}, {$sort: { createdAt: 1 }}]);
}

/**
 * This function retrieves all messages from a specific conversation by its ID.
 * It takes in the conversation ID as a parameter and returns the message documents, sorted by creation date in ascending order.
 * @param {string} messageConversationId - The unique identifier for the conversation.
 * @returns {Promise<IMessageDocument[]>} - An array of message documents from the specified conversation.
 */
export const getUserMessages = async (messageConversationId: string): Promise<IMessageDocument[]> => {
    return MessageModel.aggregate([
        {$match: {conversationId: messageConversationId}},
        {$sort: { createdAt: 1 }}
    ]);
}

/**
 * This function updates the offer status of a message in the database.
 * It takes in the message ID and the type of offer update as parameters and returns the updated message document.
 * @param {string} messageId - The unique identifier for the message to be updated.
 * @param {string} type - The type of offer update (e.g., 'accepted', 'rejected').
 * @returns {Promise<IMessageDocument>} - The updated message document.
 */
export const updateOffer = async (messageId: string, type: string): Promise<IMessageDocument> => {
    return await MessageModel.findOneAndUpdate(
        {_id: messageId},
        {
            $set: {
                [`offer.${type}`]: true
            }
        },
        {new: true}
    ) as IMessageDocument;
}

export const markMessageAsRead = async (messageId: string): Promise<IMessageDocument> => {
    const message: IMessageDocument = await MessageModel.findOneAndUpdate(
        { _id: messageId },
        { $set: {
                isRead: true
            }},
        { new: true }
    ) as IMessageDocument;

    socketIOChatObject.emit('message updated', messageId);

    return message;
}

export const markManyMessagesAsRead = async (receiver: string, sender: string, messageId: string): Promise<IMessageDocument> => {
    const updateResult = await MessageModel.updateMany(
        {
            senderUsername: sender,
            receiverUsername: receiver,
            isRead: false
        },
        {
            $set: {
                isRead: true
            }
        },
    ) as IMessageDocument;

    if (updateResult){
        const message: IMessageDocument = await MessageModel.findOne({ _id: messageId }).exec() as IMessageDocument;
        socketIOChatObject.emit('message updated', messageId);
        return message;
    } else {
        throw new Error('No messages were updated');
    }
}


