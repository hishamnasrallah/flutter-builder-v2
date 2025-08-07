// src/app/core/services/logger.service.ts

import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.INFO;
  private isDevelopment = true; // In production, set to false

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, error, ...args);
  }

  private log(level: LogLevel, label: string, message: string, ...args: any[]): void {
    if (level < this.logLevel || !this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${label}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }
}
