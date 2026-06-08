export default function SourceBadge({ source, size = 'md' }) {
  if (!source) return null

  return (
    <span className={`source-badge source-badge-${size}`}>
      {source.icon_url && (
        <img src={source.icon_url} alt="" className="source-icon" />
      )}
      <span className="source-name">{source.name}</span>
      <style jsx>{`
        .source-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .source-badge-md {
          font-size: 13px;
          padding: 4px 10px;
        }
        .source-icon {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          object-fit: cover;
        }
        .source-badge-md .source-icon {
          width: 18px;
          height: 18px;
        }
        .source-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
      `}</style>
    </span>
  )
}
