import {Application} from "express";
import {verifyGatewayRequest} from "@kariru-k/gigconnect-shared";

const BASE_PATH = '/api/v1/gig';

export const appRoutes = (app: Application): void => {
    app.use('', () => console.log('Gig Service is up and running'));
    app.use(BASE_PATH, verifyGatewayRequest, () => console.log('Gig Service API Endpoint'));
}


