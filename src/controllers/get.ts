import { Request, Response, NextFunction } from 'express';
import {IConversationDocument, IMessageDocument} from '@kariru-k/gigconnect-shared';
import {getConversation, getMessages, getUserConversationList, getUserMessages} from "../services/message.service";
import {StatusCodes} from "http-status-codes";

/**
 * This function retrieves the conversation between two users.
 * It extracts the sender's and receiver's usernames from the request parameters,
 * calls the service function to get the conversation, and sends the conversation data back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing usernames.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function in the Express.js request-response cycle.
 * @returns {Promise<void>} - A promise that resolves when the conversation is retrieved and the response is sent.
 * **/
export const conversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { senderUsername, receiverUsername } = req.params;

        const conversation: IConversationDocument[] = await getConversation(senderUsername, receiverUsername);
        res.status(StatusCodes.OK)
            .json({
                message: 'Conversation retrieved successfully',
                conversation: conversation
            });
    } catch (error) {
        next(error);
    }
}

/**
 * This function retrieves the messages between two users.
 * It extracts the sender's and receiver's usernames from the request parameters,
 * calls the service function to get the messages, and sends the message data back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing usernames.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function in the Express.js request-response cycle.
 * @returns {Promise<void>} - A promise that resolves when the messages are retrieved and the response is sent.
 * **/
export const messages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { senderUsername, receiverUsername } = req.params;

        const messages: IMessageDocument[] = await getMessages(senderUsername, receiverUsername);
        res.status(StatusCodes.OK)
            .json({
                message: 'Messages retrieved successfully',
                messages: messages
            });
    } catch (error) {
        next(error);
    }
}

/**
 * This function retrieves the conversation list for a specific user.
 * It extracts the username from the request parameters,
 * calls the service function to get the conversation list, and sends the conversation data back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing the username.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function in the Express.js request-response cycle.
 * @returns {Promise<void>} - A promise that resolves when the conversation list is retrieved and the response is sent.
 * **/
export const conversationList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username } = req.params;

        const conversations: IMessageDocument[] = await getUserConversationList(username);
        res.status(StatusCodes.OK)
            .json({
                message: 'Conversation list retrieved successfully',
                conversations: conversations
            });
    } catch (error) {
        next(error);
    }
}

/**
 * This function retrieves the messages for a specific conversation.
 * It extracts the conversation ID from the request parameters,
 * calls the service function to get the messages, and sends the message data back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing the conversation ID.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function in the Express.js request-response cycle.
 * @returns {Promise<void>} - A promise that resolves when the messages are retrieved and the response is sent.
 * **/
export const userMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { conversationId } = req.params;

        const messages: IMessageDocument[] = await getUserMessages(conversationId);
        res.status(StatusCodes.OK)
            .json({
                message: 'User messages retrieved successfully',
                messages: messages
            });
    } catch (error) {
        next(error);
    }
}
