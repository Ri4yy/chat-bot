$file = "C:\Users\ri4y\Desktop\Practice\chat-bot\admin\src\components\knowledge-base-list.tsx"
$content = Get-Content $file -Raw

$content = $content -replace "import { BrainCircuit, Database, Trash2, Clock, Loader2, Sparkles } from 'lucide-react'",
"import { BrainCircuit, Database, Trash2, Clock, Loader2, Sparkles, Search, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'"

$stateAdd = @"
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productPage, setProductPage] = useState(0)
  const [productTotal, setProductTotal] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const PRODUCTS_PER_PAGE = 20
"@

$content = $content -replace "const \[isGenerating, setIsGenerating\] = useState\(false\)", "const [isGenerating, setIsGenerating] = useState(false)`n$stateAdd"

$fetchProducts = @"
  async function fetchProducts(page = 0, search = '') {
    setIsLoadingProducts(true)
    try {
      let query = supabase.from('products').select('id, name, price, category, url, in_stock', { count: 'exact' }).eq('project_id', projectId)
      
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE - 1)

      if (error) throw error
      setProducts(data || [])
      setProductTotal(count || 0)
    } catch (e: any) {
      toast.error('Ошибка загрузки товаров: ' + e.message)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setProductPage(0)
      fetchProducts(0, productSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [productSearch])

  async function handleDeleteProduct(id: string) {
    if (!confirm('Удалить этот товар?')) return
    setIsDeletingProducts(true)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      toast.success('Товар удален')
      fetchProducts(productPage, productSearch)
      setSelectedProductIds(prev => { const n = new Set(prev); n.delete(id); return n; })
    } catch (e: any) {
      toast.error('Ошибка удаления: ' + e.message)
    } finally {
      setIsDeletingProducts(false)
    }
  }

  async function handleDeleteSelectedProducts() {
    if (selectedProductIds.size === 0) return
    if (!confirm(`Удалить ${selectedProductIds.size} выбранных товаров?`)) return
    setIsDeletingProducts(true)
    try {
      const { error } = await supabase.from('products').delete().in('id', Array.from(selectedProductIds))
      if (error) throw error
      toast.success('Товары удалены')
      fetchProducts(0, productSearch)
      setProductPage(0)
      setSelectedProductIds(new Set())
    } catch (e: any) {
      toast.error('Ошибка удаления: ' + e.message)
    } finally {
      setIsDeletingProducts(false)
    }
  }

  async function handleDeleteAllProducts() {
    if (!confirm('Удалить ВСЕ товары для этого проекта? Это действие необратимо.')) return
    setIsDeletingProducts(true)
    try {
      const { error } = await supabase.from('products').delete().eq('project_id', projectId)
      if (error) throw error
      toast.success('Все товары удалены')
      fetchProducts(0, '')
      setProductSearch('')
      setProductPage(0)
      setSelectedProductIds(new Set())
    } catch (e: any) {
      toast.error('Ошибка удаления: ' + e.message)
    } finally {
      setIsDeletingProducts(false)
    }
  }
"@

$content = $content -replace "async function fetchDocs\(\) \{", "$fetchProducts`n`n  async function fetchDocs() {"

$content = $content -replace "useEffect\(\(\) => \{`n    fetchDocs\(\)`n  \}, \[projectId\]\)", "useEffect(() => {`n    fetchDocs()`n    fetchProducts(0, '')`n  }, [projectId])"

Set-Content -Path $file -Value $content
