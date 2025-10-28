import {NextFunction, Request, Response} from "express";
import {messageSchema} from "../schemes/message";
import {BadRequestError, IMessageDocument, uploads} from "@kariru-k/gigconnect-shared";
import {UploadApiResponse} from "cloudinary";
import {addMessage, createConversation} from "../services/message.service";
import {StatusCodes} from "http-status-codes";
import crypto from "crypto";

/**
 * This function handles the creation of a new message in a conversation.
 * It validates the incoming request body against a predefined schema,
 * uploads any attached files, and saves the message to the database.
 * If the conversation does not exist, it creates a new conversation between the sender and receiver.
 * Finally, it sends a success response back to the client.
 * If there are any errors not related to validation or file upload, it passes them to the next middleware for handling.
 * @param {Request} req - The incoming request object containing message data.
 * @param {Response} res - The outgoing response object to send back to the client.
 * @param {NextFunction} next - The next middleware function in the Express.js request-response cycle.
 * @returns {Promise<void>} - A promise that resolves when the message is created and the response is sent.
 * @throws {BadRequestError} - Throws an error if validation fails or file upload fails.
 **/
export const message = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { error } = messageSchema.validate(req.body);

        if (error?.details) {
            throw new BadRequestError(error.details[0].message, 'Create message() Method Validation Error');
        }

        let file: string = req.body.file;
        const randomBytes: Buffer = crypto.randomBytes(20);
        const randomCharacters: string = randomBytes.toString('hex');

        let result: UploadApiResponse;
        if (file){
            result = (req.body.fileType === 'zip' ? await uploads(file, `${randomCharacters}.zip`) : await uploads(file)) as UploadApiResponse;
            if (!result.public_id){
                throw new BadRequestError('File upload failed. Try again', 'Create message() Method File Upload Error');
            }
            file = result?.secure_url;
        }

        const messageData: IMessageDocument = {
            conversationId: req.body.conversationId,
            body: req.body.body,
            file: file,
            fileType: req.body.fileType,
            fileSize: req.body.fileSize,
            fileName: req.body.fileName,
            gigId: req.body.gigId,
            buyerId: req.body.buyerId,
            sellerId: req.body.sellerId,
            senderUsername: req.body.senderUsername,
            senderPicture: req.body.senderPicture,
            receiverUsername: req.body.receiverUsername,
            receiverPicture: req.body.receiverPicture,
            isRead: req.body.isRead,
            hasOffer: req.body.hasOffer,
            offer: req.body.offer,
        }

        if (!req.body.hasConversationId){
            await createConversation(`${req.body.conversationId}`, `${messageData.senderUsername}`, `${messageData.receiverUsername}`);
        }

        await addMessage(messageData);
        res.status(StatusCodes.OK).json({message: 'Message sent successfully', conversationId: req.body.conversationId, messageData});

    } catch (error) {
        next(error);
    }
}
