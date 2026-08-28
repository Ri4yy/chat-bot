const fs = require('fs');
const file = 'C:/Users/ri4y/Desktop/Practice/chat-bot/admin/src/components/knowledge-base-list.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { BrainCircuit, Database, Trash2, Clock, Loader2, Sparkles } from 'lucide-react'",
  "import { BrainCircuit, Database, Trash2, Clock, Loader2, Sparkles, Search, ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react'\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'\nimport { Checkbox } from '@/components/ui/checkbox'"
);

// 2. Add State
const stateAdd = `
  const [products, setProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productPage, setProductPage] = useState(0)
  const [productTotal, setProductTotal] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [isDeletingProducts, setIsDeletingProducts] = useState(false)
  const PRODUCTS_PER_PAGE = 20
`;
content = content.replace("const [isGenerating, setIsGenerating] = useState(false)", "const [isGenerating, setIsGenerating] = useState(false)\n" + stateAdd);

// 3. Add fetch logic
const fetchProducts = `
  async function fetchProducts(page = 0, search = '') {
    setIsLoadingProducts(true)
    try {
      let query = supabase.from('products').select('id, name, price, category, url, in_stock', { count: 'exact' }).eq('project_id', projectId)
      
      if (search.trim()) {
        query = query.ilike('name', \`%\${search.trim()}%\`)
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
    if (!confirm(\`Удалить \${selectedProductIds.size} выбранных товаров?\`)) return
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
`;
content = content.replace("async function fetchDocs() {", fetchProducts + "\n\n  async function fetchDocs() {");
content = content.replace("useEffect(() => {\n    fetchDocs()\n  }, [projectId])", "useEffect(() => {\n    fetchDocs()\n    fetchProducts(0, '')\n  }, [projectId])");


// 4. Wrap in Tabs
const tabsStart = `<div className="space-y-6 mt-4">
      <Tabs defaultValue="texts" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-zinc-900 border border-zinc-800 p-1 mb-4 h-auto">
          <TabsTrigger value="texts" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2">Текстовые фрагменты</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2">Каталог товаров</TabsTrigger>
        </TabsList>
        <TabsContent value="texts" className="space-y-6">`;

content = content.replace('<div className="space-y-6 mt-4">', tabsStart);

const productsView = `
        </TabsContent>
        <TabsContent value="products">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-slate-100">Каталог товаров</CardTitle>
                <CardDescription className="text-zinc-400">Товары, которые ИИ использует для рекомендаций ({productTotal}).</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Поиск товаров..."
                    className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-200 w-full"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchProducts(productPage, productSearch)} className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white shrink-0">
                  Обновить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center p-8 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30 text-zinc-500">
                  Товары не найдены. Вы можете загрузить их через Excel фид на вкладке "База знаний".
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-zinc-900/50 p-2 rounded-md border border-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedProductIds.size > 0 && selectedProductIds.size === products.length}
                        onCheckedChange={(c) => {
                          if (c) {
                            setSelectedProductIds(new Set(products.map(p => p.id)))
                          } else {
                            setSelectedProductIds(new Set())
                          }
                        }}
                        className="border-zinc-600 data-[state=checked]:bg-primary"
                      />
                      <span className="text-sm text-zinc-400">Выбрать все на странице</span>
                    </div>
                    {selectedProductIds.size > 0 && permissions.includes('memory_delete') && (
                      <Button variant="destructive" size="sm" onClick={handleDeleteSelectedProducts} disabled={isDeletingProducts} className="h-8 text-xs">
                        {isDeletingProducts ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                        Удалить ({selectedProductIds.size})
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                      <div key={p.id} className="flex flex-col p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 group transition-colors hover:border-zinc-700">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-start gap-3 pr-6">
                            <Checkbox
                              checked={selectedProductIds.has(p.id)}
                              onCheckedChange={(c) => {
                                const newSet = new Set(selectedProductIds)
                                if (c) newSet.add(p.id)
                                else newSet.delete(p.id)
                                setSelectedProductIds(newSet)
                              }}
                              className="mt-1 border-zinc-600 data-[state=checked]:bg-primary"
                            />
                            <div>
                              <h4 className="font-medium text-slate-200 text-sm line-clamp-2">{p.name}</h4>
                              <p className="text-xs text-zinc-500 mt-1">{p.category}</p>
                            </div>
                          </div>
                          {permissions.includes('memory_delete') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteProduct(p.id)}
                              disabled={isDeletingProducts}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mt-2 -mr-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 h-8 w-8 rounded-full absolute right-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="mt-auto pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                          <span className="text-sm font-semibold text-primary">{p.price} ?</span>
                          <span className={\`text-xs px-2 py-0.5 rounded-full \${p.in_stock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}\`}>
                            {p.in_stock ? 'В наличии' : 'Нет в наличии'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <p className="text-sm text-zinc-500">
                      Показано {products.length} из {productTotal} товаров
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setProductPage(p => p - 1); fetchProducts(productPage - 1, productSearch) }}
                        disabled={productPage === 0 || isLoadingProducts}
                        className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-zinc-400 min-w-8 text-center">
                        {productPage + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { setProductPage(p => p + 1); fetchProducts(productPage + 1, productSearch) }}
                        disabled={(productPage + 1) * PRODUCTS_PER_PAGE >= productTotal || isLoadingProducts}
                        className="bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {permissions.includes('memory_delete') && productTotal > 0 && (
                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDeleteAllProducts}
                        disabled={isDeletingProducts}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20"
                      >
                        {isDeletingProducts ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Удалить все товаров ({productTotal})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
`;

// Find the last </div> and replace from there
const lastDivIndex = content.lastIndexOf('    </div>');
if (lastDivIndex !== -1) {
    content = content.substring(0, lastDivIndex) + productsView;
}

fs.writeFileSync(file, content, 'utf8');
console.log('Success');
