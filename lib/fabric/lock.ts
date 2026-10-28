/** Pure helpers for object lock state in design JSON + Fabric props. */

export type LockProps = {
  locked: boolean
  lockMovementX: boolean
  lockMovementY: boolean
  lockScalingX: boolean
  lockScalingY: boolean
  lockRotation: boolean
  editable?: boolean
}

export function lockPropsFromFlag(locked: boolean): LockProps {
  return {
    locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    editable: locked ? false : undefined,
  }
}

export function serializeLocked(obj: {
  locked?: boolean
  lockMovementX?: boolean
  lockMovementY?: boolean
  data?: { locked?: boolean }
}): boolean {
  if (typeof obj.locked === 'boolean') return obj.locked
  if (obj.data && typeof obj.data.locked === 'boolean') return obj.data.locked
  return !!(obj.lockMovementX && obj.lockMovementY)
}

export function applyLockToData<T extends Record<string, unknown>>(
  data: T | undefined,
  locked: boolean
): T & { locked: boolean } {
  return { ...(data || ({} as T)), locked }
}
