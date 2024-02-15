import {createContext, PropsWithChildren, useContext, Context} from "react";
import {useImmer} from "use-immer";

type UndoRedoState<T = unknown> = {
    history: T[]
    current_index: number
}

interface IUndoRedo<T = unknown> {
    current: T
    can_undo: boolean
    can_redo: boolean
    undo: () => void
    redo: () => void
    set: (payload: T) => void
    reset: () => void
    update: (payload: T) => void
}

const UndoRedoContext = createContext({} as IUndoRedo)

export function useUndoRedoContext<T>() {
  const context = useContext<IUndoRedo<T>>(
    (UndoRedoContext) as Context<IUndoRedo<T>>
  );
  if (!context) {
    throw new Error('useUndoRedoContext must be used under UndoRedoProvider');
  }
  return context;
}

export default function UndoRedoProvider({children}: PropsWithChildren) {
    const [state, setState] = useImmer<UndoRedoState>({
        history: [],
        current_index: 0
    })

    return <UndoRedoContext.Provider value={{
        current: state.history[state.current_index],
        can_undo: state.current_index > 0,
        can_redo: state.current_index < state.history.length - 1,
        undo: () => setState({
            ...state,
            current_index: state.current_index - 1 >= 0 ? state.current_index - 1 : 0
        }),
        redo: () => setState({
            ...state,
            current_index: state.current_index + 1
        }),
        set: (payload: unknown) => setState({
            history: [payload],
            current_index: 0
        }),
        reset: () => setState({
            history: [state.history.length? state.history[0] : []],
            current_index: 0
        }),
        update: (payload: unknown) => setState({
            history: [...state.history.slice(0, state.current_index + 1), payload],
            current_index: state.current_index + 1
        })
    }}>
        {children}
    </UndoRedoContext.Provider>
}