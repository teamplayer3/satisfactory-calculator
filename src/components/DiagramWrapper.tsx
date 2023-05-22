import * as go from 'gojs';

import { ReactPalette } from "gojs-react"
import { CSSProperties, ReactNode, useContext, useEffect, useRef, useState } from "react"
import { Machines } from '../domain/machine';
import { PortMode } from '../domain/nodeGraph/node';
import ReactDiagram from './GoJsDiagram';



export default function DiagramWrapper(props: {
    nodeDataArray: go.ObjectData[],
    linkDataArray: go.ObjectData[],
    modelData: go.ObjectData,
    onDiagramEvent: (e: go.DiagramEvent) => void,
    onModelChange: (data: go.IncrementalData) => void,
    skipsDiagramUpdate: boolean,
    style?: CSSProperties
}) {

    const UnselectedBrush = "lightgray";  // item appearance, if not "selected"

    const $ = go.GraphObject.make;

    function makeItemTemplate(input: boolean) {
        return $(go.Panel, "Auto",
            { margin: new go.Margin(4, 0) },  // some space between ports
            $(go.Shape,
                {
                    name: "SHAPE",
                    fill: UnselectedBrush, stroke: "gray",
                    geometryString: "F1 m 0,0 l 5,0 1,4 -1,4 -5,0 1,-4 -1,-4 z",
                    spot1: new go.Spot(0, 0, 5, 1),  // keep the text inside the shape
                    spot2: new go.Spot(1, 1, -5, 0),
                    // some port-related properties
                    toSpot: go.Spot.Left,
                    toLinkable: input,
                    fromSpot: go.Spot.Right,
                    fromLinkable: !input,
                    cursor: "pointer",
                    fromMaxLinks: 1,
                    toMaxLinks: 1,
                },
                new go.Binding("portId", "portId")),
            $(go.Panel, "Vertical",
                $(go.TextBlock,
                    new go.Binding("text", "resource"),
                    { margin: new go.Margin(1, 5), font: "10px Segoe UI,sans-serif" }
                ),
                $(go.TextBlock,
                    new go.Binding("text", "flow"),
                    { margin: new go.Margin(0, 0), font: "10px Segoe UI,sans-serif" }
                )
            )
        );
    }

    const machinePart = $(go.Node, "Spot",
        { selectionAdorned: false },
        { locationSpot: go.Spot.Center, locationObjectName: "BODY" },
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),

        // the body
        $(go.Panel, "Auto",
            {
                row: 1, column: 1, name: "BODY",
                stretch: go.GraphObject.Fill
            },
            $(go.Shape, "RoundedRectangle",
                new go.Binding("fill", "color"),
                {
                    stroke: null, strokeWidth: 0,
                    minSize: new go.Size(60, 60)
                }),
            $(go.TextBlock,
                { margin: 10, textAlign: "center", font: "bold 14px Segoe UI,sans-serif", stroke: "#484848", editable: true },
                new go.Binding("text", "name").makeTwoWay())
        ),  // end Auto Panel body

        // the Panel holding the left port elements, which are themselves Panels,
        // created for each item in the itemArray, bound to data.leftArray
        $(go.Panel, "Vertical",
            { name: "LEFTPORTS", alignment: new go.Spot(0, 0.5, -5, 0) },
            new go.Binding("itemArray", "inputPorts"),
            { itemTemplate: makeItemTemplate(true) }
        ),

        // the Panel holding the right port elements, which are themselves Panels,
        // created for each item in the itemArray, bound to data.rightArray
        $(go.Panel, "Vertical",
            { name: "RIGHTPORTS", alignment: new go.Spot(1, 0.5, 5, 0) },
            new go.Binding("itemArray", "outputPorts"),
            { itemTemplate: makeItemTemplate(false) }
        )
    )

    function initDiagram() {
        const $ = go.GraphObject.make;
        // set your license key here before creating the diagram: go.Diagram.licenseKey = "...";
        const diagram =
            $(go.Diagram,
                {
                    'undoManager.isEnabled': true,  // must be set to allow for model change listening
                    // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
                    // 'clickCreatingTool.archetypeNodeData': { text: 'new node', color: 'lightblue' },
                    model: new go.GraphLinksModel(
                        {
                            linkKeyProperty: "key",
                            copiesArrays: true,
                            copiesArrayObjects: true,
                            linkFromPortIdProperty: "fromPort",
                            linkToPortIdProperty: "toPort",
                        })
                });

        // define a simple Node template
        diagram.nodeTemplateMap.add("Machine", machinePart)

        function sameResource(fromNode: go.Node, fromPort: any, toNode: go.Node, toPort: any): boolean {
            const outResource = fromNode.data.outputPorts.find((p: any) => p.portId === fromPort.portId).resource
            const inResource = toNode.data.inputPorts.find((p: any) => p.portId === toPort.portId).resource
            return outResource === inResource
        }

        diagram.toolManager.linkingTool.linkValidation = sameResource;
        diagram.toolManager.relinkingTool.linkValidation = sameResource;


        // an orthogonal link template, reshapable and relinkable
        diagram.linkTemplate =
            $(go.Link,
                { routing: go.Link.Orthogonal, corner: 10, toShortLength: -3 },
                { relinkableFrom: true, relinkableTo: true, reshapable: true, resegmentable: true },
                $(go.Shape, { stroke: "gray", strokeWidth: 2.5 }),
                $(go.TextBlock,  // the "from" label
                    {
                        textAlign: "center",
                        font: "bold 14px sans-serif",
                        stroke: "#1967B3",
                        segmentIndex: 0,
                        segmentOffset: new go.Point(NaN, NaN),
                        segmentOrientation: go.Link.OrientUpright
                    },
                    new go.Binding("text", "inputFlow")),
                $(go.TextBlock,
                    {
                        textAlign: "center",
                        font: "bold 14px sans-serif",
                        stroke: "#1967B3",
                        segmentIndex: 2,
                        segmentFraction: 0.5,
                        segmentOrientation: go.Link.Horizontal
                    },
                    new go.Binding("text", "flow")),
                $(go.TextBlock,  // the "to" label
                    {
                        textAlign: "center",
                        font: "bold 14px sans-serif",
                        stroke: "#1967B3",
                        segmentIndex: -1,
                        segmentOffset: new go.Point(NaN, NaN),
                        segmentOrientation: go.Link.OrientUpright
                    },
                    new go.Binding("text", "outputFlow"))
            );


        return diagram
    }

    function initPalette(): go.Palette {
        let map = new go.Map<string, go.Part>()
        map.add("Machine", machinePart)
        let palette =
            $(go.Palette, // must name or refer to the DIV HTML element
                {
                    nodeTemplateMap: map,
                });

        return palette
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "row"
        }}>
            <ReactPalette
                initPalette={initPalette}
                divClassName='palette-component'
                style={{ backgroundColor: '#eee', height: 1000, width: 200 }}
                nodeDataArray={Machines.machineTemplates.map((machine) => ({
                    key: machine.id,
                    name: machine.name,
                    color: "orange",
                    category: "Machine",
                    inputPorts: machine.ports.filter((port) => port.mode === PortMode.input).map((port) => ({
                        "portColor": "#fae3d7", "portId": port.id
                    })),
                    outputPorts: machine.ports.filter((port) => port.mode === PortMode.output).map((port) => ({
                        "portColor": "#fae3d7", "portId": port.id
                    }))
                }))}
            />
            <ReactDiagram
                divClassName='diagram-component'
                initDiagram={initDiagram}
                nodeDataArray={props.nodeDataArray}
                linkDataArray={props.linkDataArray}
                modelData={props.modelData}
                onModelChange={props.onModelChange}
                skipsDiagramUpdate={props.skipsDiagramUpdate}
                style={props.style}
            />
        </div>
    )

}