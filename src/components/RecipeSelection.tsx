import React, { MouseEvent } from "react"
import { MachineConfiguration } from "../domain/machine"

export function RecipeSelection(props: {
    visible: boolean,
    selectionList: MachineConfiguration[],
    onSelected: (config: MachineConfiguration) => void,
    onCancel: () => void
}) {

    function onClickAway() {
        props.onCancel()
    }

    function onSelect(e: MouseEvent, config: MachineConfiguration) {
        e.stopPropagation()
        props.onSelected(config)
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
                    props.selectionList.map((config) => {
                        return (
                            <li key={config.name} style={{
                                cursor: "pointer"
                            }} onClick={(e) => onSelect(e, config)}>
                                <p>{config.name}</p>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}