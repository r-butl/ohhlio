import React from "react";
import { useEditorStore } from "../../events/EditorStore";
import emitter
 from "../../events/EventBus";


const CancelButton: React.FC<{}> = () => {

    const setActiveEditor = useEditorStore(state => state.setActiveEditor);
    const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState)

    const handleCancel = () => {
        emitter.emit('cancel-edit');
        setActiveEditor(null);
        setButtonHoveredState(false);
    }

    return (
        <button onClick={ handleCancel } className="cancel-button">✕</button>
    )

}

export default CancelButton