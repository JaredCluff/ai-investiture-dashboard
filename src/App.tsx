import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import TradeHistory from './pages/TradeHistory'
import MarketView from './pages/MarketView'
import About from './pages/About'
import OrgChart from './pages/OrgChart'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Research from './pages/Research'
import ResearchDetail from './pages/ResearchDetail'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Search from './pages/Search'
import Messages from './pages/Messages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          {/* Portfolio */}
          <Route path="overview" element={<Overview />} />
          <Route path="trades" element={<TradeHistory />} />
          <Route path="market" element={<MarketView />} />
          {/* Company */}
          <Route path="org" element={<OrgChart />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:identifier" element={<TicketDetail />} />
          <Route path="messages" element={<Messages />} />
          {/* Knowledge */}
          <Route path="research" element={<Research />} />
          <Route path="research/:id" element={<ResearchDetail />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="search" element={<Search />} />
          {/* About */}
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
