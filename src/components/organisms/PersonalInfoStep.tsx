import React from 'react'
import { FormInput } from '../atoms/FormInput'
import { SectionTitle } from '../atoms/SectionTitle'
import { StepNavigation } from '../molecules/StepNavigation'
import { Card, CardHeader, CardContent, CardFooter } from '../atoms/Card'

interface Props {
  fullName: string
  setFullName: (val: string) => void
  age: string
  setAge: (val: string) => void
  onNext: () => void
}

export const PersonalInfoStep: React.FC<Props> = ({ fullName, setFullName, age, setAge, onNext }) => (
  <div className="max-w-xl mx-auto p-4">
    <Card>
      <CardHeader>
        <SectionTitle>ThA'ng tin cA� nhA�n</SectionTitle>
      </CardHeader>
      <CardContent>
        <FormInput label="H��? vA� tA�n" value={fullName} onChange={setFullName} />
        <FormInput label={"Tu��\u0007i"} value={age} onChange={setAge} type="number" />
      </CardContent>
      <CardFooter>
        <StepNavigation onBack={() => {}} onNext={onNext} showBack={false} />
      </CardFooter>
    </Card>
  </div>
)

