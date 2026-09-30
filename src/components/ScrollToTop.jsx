import Icon from './Icon'
import { useScrolledPast } from '../hooks/usePortfolio'

export default function ScrollToTop() {
  const visible = useScrolledPast(600)

  return (
    <button
      type="button"
      className={`to-top ${visible ? 'is-visible' : ''}`.trim()}
      onClick={() => window.scrollTo({ top: 0 })}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
    >
      <Icon name="arrowUp" size={19} />
    </button>
  )
}
