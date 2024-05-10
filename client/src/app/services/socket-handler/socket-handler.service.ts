import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketHandlerService {
    socket: Socket;

    constructor(private readonly router: Router) {}

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        this.socket = io(environment.serverUrlWithoutApi, { transports: ['websocket'], upgrade: false });
    }

    disconnect() {
        this.socket.disconnect();
        this.router.navigateByUrl('/home');
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    // Any is required to simulate Function type in tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send<T>(event: string, data?: T, callback?: (param: any) => any): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
