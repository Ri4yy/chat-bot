"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Settings2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function SuperAdminCostEstimator({ totalTokens }: { totalTokens: number }) {
  const [costPer1M, setCostPer1M] = useState<number>(1.00)
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('1.00')

  useEffect(() => {
    const saved = localStorage.getItem('superadmin_token_cost')
    if (saved) {
      setCostPer1M(parseFloat(saved))
      setInputValue(saved)
    }
  }, [])

  const handleSave = () => {
    const val = parseFloat(inputValue)
    if (!isNaN(val) && val >= 0) {
      setCostPer1M(val)
      localStorage.setItem('superadmin_token_cost', val.toString())
    }
    setIsEditing(false)
  }

  const estimatedCost = (totalTokens / 1_000_000) * costPer1M

  return (
    <Card className="bg-zinc-900/50 border-green-500/30 relative group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Оценка затрат</CardTitle>
        <DollarSign className="w-4 h-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-green-400">
          ${estimatedCost.toFixed(4)}
        </div>
        
        {isEditing ? (
          <div className="mt-2 flex items-center gap-2">
            <Input 
              type="number" 
              step="0.01" 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)}
              className="h-7 text-xs bg-zinc-950 border-zinc-700 w-24"
            />
            <Button size="sm" onClick={handleSave} className="h-7 px-2 text-xs">Сохр.</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-zinc-500">
              Из расчета ${costPer1M.toFixed(2)} / 1M токенов
            </p>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
