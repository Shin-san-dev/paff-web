import { useMutation } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import { playerAvatars } from '../../../shared/playerAvatars'
import './AvatarPicker.css'

export function AvatarPicker({ currentPath, onCancel, onSaved }: {
  currentPath: string
  onCancel: () => void
  onSaved: () => void
}) {
  const updateAvatar = useMutation(api.players.updateMyAvatar)
  const [selected, setSelected] = useState(currentPath)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  function cancel() {
    dialogRef.current?.close()
    onCancel()
  }

  return <dialog className="avatar-picker-dialog" ref={dialogRef} aria-labelledby="avatar-picker-title" onCancel={(event) => {
    event.preventDefault()
    if (!busy) cancel()
  }}><form className="avatar-picker" onSubmit={async (event) => {
    event.preventDefault()
    if (busy || selected === currentPath) return
    setBusy(true)
    setError('')
    try {
      await updateAvatar({ avatarPath: selected })
      dialogRef.current?.close()
      onSaved()
    } catch {
      setError('L’avatar n’a pas pu être enregistré. Réessaie dans un instant.')
      setBusy(false)
    }
  }}>
    <fieldset disabled={busy}>
      <legend id="avatar-picker-title">Choisis ton avatar</legend>
      <div className="avatar-picker__choices">
        {playerAvatars.map((avatar) => <label className="avatar-choice" key={avatar.path}>
          <input type="radio" name="avatar" value={avatar.path} checked={selected === avatar.path} onChange={() => setSelected(avatar.path)} />
          <img src={avatar.path} alt="" width="80" height="80" />
          <span>{avatar.label}</span>
        </label>)}
      </div>
    </fieldset>
    {error && <p className="avatar-picker__error" role="alert">{error}</p>}
    <div className="avatar-picker__actions">
      <button className="ui-button ui-button--primary" type="submit" disabled={busy || selected === currentPath}>{busy ? 'Enregistrement…' : 'Enregistrer l’avatar'}</button>
      <button className="ui-button ui-button--quiet" type="button" disabled={busy} onClick={cancel}>Annuler</button>
    </div>
  </form></dialog>
}
