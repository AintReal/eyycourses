import Signup from './components/Signup'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Signup /> 
    </ErrorBoundary>
  )
}
export default App