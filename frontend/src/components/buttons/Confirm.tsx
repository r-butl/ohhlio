import React from "react";
import { useEditorStore } from "../../events/EditorStore";
import emitter
 from "../../events/EventBus";


const ConfirmButton: React.FC<{ id: string }> = ({ id }) => {

    const setActiveEditor = useEditorStore(state => state.setActiveEditor);
    const setButtonHoveredState = useEditorStore(state => state.setButtonHoveredState)

    const handleConfirm = () => {
        emitter.emit('confirm-edit', { id });
        setActiveEditor(null);
        setButtonHoveredState(false);
      }

    return (
        <button onClick={ handleConfirm } className="confirm-button">✓</button>
    )

}

export default ConfirmButton