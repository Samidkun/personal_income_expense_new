export default function Loading() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            minHeight: '200px'
        }}>
            <div className="loading-spinner"></div>
        </div>
    )
}
