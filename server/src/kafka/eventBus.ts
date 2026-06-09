// Simulated event bus: An in-process EventEmitter that models Kafka-style topic pub/sub.
// Producers publish to a topic; Consumers subscribe (no external broker).

import { EventEmitter } from "node:events";

import type {
  TelemetryEvent,
  RouteAssignmentEvent,
  RouteClearedEvent,
} from "@shared/types";

import {
  TOPIC_VEHICLE_TELEMETRY,
  TOPIC_ROUTE_ASSIGNED,
  TOPIC_ROUTE_CLEARED,
  type Topic,
} from "@server/kafka/topics";

const MAX_LISTENERS = 50;

type EventByTopic = {
  [TOPIC_VEHICLE_TELEMETRY]: TelemetryEvent;
  [TOPIC_ROUTE_ASSIGNED]: RouteAssignmentEvent;
  [TOPIC_ROUTE_CLEARED]: RouteClearedEvent;
};

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(MAX_LISTENERS);
  }

  publish<T extends Topic>(topic: T, event: EventByTopic[T]): void {
    this.emitter.emit(topic, event);
  }

  subscribe<T extends Topic>(
    topic: T,
    handler: (event: EventByTopic[T]) => void,
  ): () => void {
    this.emitter.on(topic, handler as (e: unknown) => void);

    return () => this.emitter.off(topic, handler as (e: unknown) => void);
  }
}

export const eventBus = new EventBus();
