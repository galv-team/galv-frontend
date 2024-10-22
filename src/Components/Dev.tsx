import React from 'react'

export function Dev() {
    if (!import.meta.env.DEV) {
        return <></>
    }
    return <></>
}
