import React, { MouseEvent } from "react"
import { FlowRate } from "../domain/itemFlow"

export function ConveyorSelection(props: {
    visible: boolean,
    selectionList: FlowRate[],
    onSelected: (flow: FlowRate) => void,
    onCancel: () => void
}) {

    function onClickAway() {
        props.onCancel()
    }

    function onSelect(e: MouseEvent, rate: FlowRate) {
        e.stopPropagation()
        props.onSelected(rate)
    }

    return (
        <div style={{
            display: props.visible ? "flex" : "none",
            zIndex: 1000,
            position: "fixed",
            width: "100vw",
            height: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }} onClick={onClickAway}>
            <ul style={{
                width: 300,
                height: 500,
                backgroundColor: "gray"
            }}>
                {
                    props.selectionList.map((rate) => {
                        return (
                            <li key={rate.rate} style={{
                                cursor: "pointer"
                            }} onClick={(e) => onSelect(e, rate)}>
                                <p>{rate.rate}</p>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}