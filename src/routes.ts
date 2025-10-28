import {Application} from "express";
import {verifyGatewayRequest} from "@kariru-k/gigconnect-shared";
import {healthRoutes} from "./routes/health";
import {messageRoutes} from "./routes/message";

const BASE_PATH = '/api/v1/message';

export const appRoutes = (app: Application): void => {
    app.use('', healthRoutes());
    app.use(BASE_PATH, verifyGatewayRequest, messageRoutes());
}


