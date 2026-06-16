import { useMemo } from 'react';
import { useEditorStore } from '../context/EditorStore';

export const useContentCheck = ( id: string) => {
    // Checks if the current item contains any content

    const item = useEditorStore(state => {
        for (const section of state.currentProject.items.sections) {
            const found = section.items.find(i => i.id === id);
            if (found) return found;
        }
        return null;
    });

    return useMemo(() => {

    if (!item) return false;

    if ( item.type === "image" ) {
        return item.props.originalImage !== null;
    } else if ( item.type === "text" ) {
        return item.props.content !== "";
    }

    return false;
    }, [item]);

};
