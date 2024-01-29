/**
 * simple http server to run the lambda on local PC for dev/test
 * NOT INTENDED FOR PRODUCTION USE
 */
'use strict';

import { handler } from './dist/index.mjs';
import { createServer } from 'node:http';

const config = {
    port: process.env.PORT || 3000,
};

const server = createServer((request, response) => {
    const context = {};
    context.awsRequestId = Math.random().toString(36).substring(7);
    console.info('request ', request.method, request.url, context);
    let body = '';
    request.on('data', (chunk) => {
        body += chunk;
    });

    request.on('end', async () => {
        try {
            if (request.method === 'OPTIONS') {
                console.log('OPTIONS will respond with 200 and CORS headers');
                // CORS support
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Max-Age': '86400',
                });
                response.end();
                return;
            } else if (request.method === 'GET' && request.url === '/') {
                console.log('GET will respond with 200 and CORS headers')
                // CORS support
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Max-Age': '86400',
                });
                response.end();
                return;
            }
            else if (request.method === 'POST' && request.url === '/') {
                const result = await handler(
                    {
                        path: request.url,
                        httpMethod: request.method,
                        body: body,
                        headers: request.headers,
                    },
                    { awsRequestId: context.awsRequestId }
                );

                const headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                };
                response.writeHead(result.statusCode || 200, result.headers ||
                    headers);
                response.end(result.body, 'utf-8');
                return;
            } else {
                response.writeHead(404, { 'Content-Type': 'text/plain' });
                response.end(`No such route: ${request.method} ${request.url}`,
                    'utf-8');
            }
        } catch (err) {
            // we will get here only in case of real exception - all server issues are handled by lambda
            console.error('Failed to process request [%s %s]: %s',
                request.method, request.url, err.message);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end(err.message, 'utf-8');
            return;
        }
    });
});

server.listen(config.port, () => {
    console.info('Server running at http://127.0.0.1:%s/', config.port);
});
