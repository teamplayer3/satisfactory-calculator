import Node, { Connection } from "./nodeGraph/node"


export class Diagram {

    diagram: go.Diagram

    constructor(diagram: go.Diagram) {
        this.diagram = diagram
    }

    updateNodes(nodes: Node[]) {
        this.diagram.commit(d => {
            nodes.forEach(node => {
                const diagramNode = d.findNodeForKey(node.id)
                if (diagramNode) diagramNode.data = {
                    ...diagramNode.data,
                    ...nodeToNodeData(node)
                }
            })

        }, "update node")
    }

    deleteNodes(nodeIds: number[]) {
        this.diagram.commit(d => {
            const filter = <TValue>(v: TValue | null): v is TValue => v !== null
            const parts: go.Part[] = nodeIds.map(id => d.findNodeForKey(id)).filter(filter)

            d.removeParts(parts)
        }, "delete nodes")
    }

    updateConnections(connections: Connection[]) {
        this.diagram.commit(d => {
            connections.forEach(connection => {
                const link = d.findLinkForKey(connection.id)
                console.log(link)
                if (link) {

                    link.data = {
                        ...link.data,
                        inputFlow: connection.calculateUnderOverflowOnInput(),
                        outputFlow: connection.calculateUnderOverflowOnOutput(),
                        flow: connection.conveyor.maxFlow.rate
                    }
                }
            });

        }, "update link")
    }

    deleteConnections(connectionIds: number[]) {
        this.diagram.commit(d => {
            const filter = <TValue>(v: TValue | null): v is TValue => v !== null
            const links: go.Link[] = connectionIds.map(id => d.findLinkForKey(id)).filter(filter)

            d.removeParts(links)
        }, "delete links")
    }

}

function nodeToNodeData(node: Node): go.ObjectData {
    return {
        key: node.id,
        name: node.metaData !== undefined ? node.metaData.name : "undefined",
        color: "orange",
        category: "Machine",
        inputPorts: node.inputPorts.map((port) => ({
            "portColor": "#fae3d7", "portId": port.id, resource: port.item.resource!.name, flow: port.flow.rate
        })),
        outputPorts: node.outputPorts.map((port) => ({
            "portColor": "#fae3d7", "portId": port.id, resource: port.item.resource!.name, flow: port.flow.rate
        })),
    }
}