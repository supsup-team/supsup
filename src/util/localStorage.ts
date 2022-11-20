'use strict';

import { Memento } from "vscode";

export class LocalStorage {
    constructor (
        private storage: Memento
    ) {}

    public setValue<T>(key: string, value: T): void {
        this.storage.update(key, value);
    }

    public getValue<T>(key: string): T {
        return this.storage.get<T>(key, null as T);
    }
}