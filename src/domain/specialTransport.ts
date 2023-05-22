import { DynamicFlow } from "./itemFlow";
import Node, { NodeType, PortMode } from "./nodeGraph/node";
import { DynamicResource } from "./resources";


export class Splitter extends Node {
    constructor(id: number) {
        super(id, NodeType.Special, [
            {
                id: 0,
                flow: new DynamicFlow(0),
                item: new DynamicResource(undefined),
                mode: PortMode.input
            },
            {
                id: 1,
                flow: new DynamicFlow(0),
                item: new DynamicResource(undefined),
                mode: PortMode.output
            },
            {
                id: 2,
                flow: new DynamicFlow(0),
                item: new DynamicResource(undefined),
                mode: PortMode.output
            },
            {
                id: 3,
                flow: new DynamicFlow(0),
                item: new DynamicResource(undefined),
                mode: PortMode.output
            },
        ], undefined)
    }
}