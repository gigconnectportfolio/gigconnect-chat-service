import {NextFunction, Request, Response} from "express";
import {IMessageDocument} from "@kariru-k/gigconnect-shared";
import {markManyMessagesAsRead, markMessageAsRead, updateOffer} from "../services/message.service";
import {StatusCodes} from "http-status-codes";

/**
 * This function handles updating the offer status of a message.
 * It extracts the message ID and offer type from the request body,
 * calls the service function to update the offer status, and sends a success response back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing message data.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function for error handling.
 */
export const offer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { messageId, type } = req.body;

        // Call the service function to update the offer status
        const message: IMessageDocument = await updateOffer(messageId, type);

        res.status(StatusCodes.OK).json({
            message: 'Message updated successfully',
            singleMessage: message
        });

    } catch (error) {
        next(error);
    }
}

/**
 * This function handles marking multiple messages as read.
 * It extracts the receiver username, sender username, and message ID from the request body,
 * calls the service function to mark the messages as read, and sends a success response back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing message data.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function for error handling.
 */
export const markMultipleMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { receiverUsername, senderUsername, messageId } = req.body;

        // Call the service function to mark many messages as read
        await markManyMessagesAsRead(receiverUsername, senderUsername, messageId);

        res.status(StatusCodes.OK).json({
            message: 'Messages marked as read',
        });

    } catch (error) {
        next(error);
    }
}

/**
 * This function handles marking a single message as read.
 * It extracts the message ID from the request body,
 * calls the service function to mark the message as read, and sends a success response back to the client.
 * If there are any errors, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing message data.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function for error handling.
 */
export const markSingleMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { messageId } = req.body;

        // Call the service function to mark a single message as read
        const message: IMessageDocument = await markMessageAsRead(messageId);

        res.status(StatusCodes.OK).json({
            message: 'Message marked as read successfully',
            singleMessage: message
        });

    } catch (error) {
        next(error);
    }
}
