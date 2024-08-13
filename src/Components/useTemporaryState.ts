// https://soorria.com/snippets/use-temporary-state-react

import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

export const useTemporaryState = <State>(
    initial: State | (() => State),
    timeout = 2000,
): [State, Dispatch<SetStateAction<State>>] => {
    const [state, _setState] = useState<State>(initial)
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
    const initialValueRef = useRef(initial)

    useEffect(() => {
        initialValueRef.current = initial
    }, [initial])

    const setState: typeof _setState = useCallback(
        async (valueOrUpdater) => {
            _setState(valueOrUpdater)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(
                () => _setState(initialValueRef.current),
                timeout,
            )
        },
        [timeout],
    )

    return [state, setState]
}
