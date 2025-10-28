import {Router} from "express";
import {conversation, conversationList, messages, userMessages} from "../controllers/get";
import {message} from "../controllers/create";
import {markMultipleMessages, markSingleMessage, offer} from "../controllers/update";

const router: Router = Router();

export const messageRoutes = (): Router => {
    router.get('/conversation/:senderUsername/:receiverUsername', conversation);
    router.get('/conversations/:username', conversationList);
    router.get('/:senderUsername/:receiverUsername', messages);
    router.get('/:conversationId', userMessages);
    router.post('/', message);
    router.put('/offer', offer);
    router.put('/mark-as-read', markSingleMessage);
    router.put('/mark-multiple-as-read', markMultipleMessages);

    return router;
}
