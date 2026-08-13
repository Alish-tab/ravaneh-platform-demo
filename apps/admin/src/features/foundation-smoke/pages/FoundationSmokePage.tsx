import { useState } from 'react';

import {
  Button,
  Checkbox,
  Field,
  InlineMessage,
  Input,
  LtrData,
  Panel,
  Radio,
  Select,
  StatusBadge,
  Toast,
  Toggle,
} from '@/shared/ui';

/**
 * Small visual smoke for Design Foundation primitives.
 * Not product navigation — linked only from Home for local verification.
 */
export function FoundationSmokePage() {
  const [toggleOn, setToggleOn] = useState(true);

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Foundation Smoke</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          بررسی Visual primitives روی Base فعلی — بدون Fake business data.
        </p>
      </div>

      <Panel title="Controls">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="ورودی" hint="نمونه hint" htmlFor="f-name">
              <Input id="f-name" placeholder="نام…" />
            </Field>
            <Field label="خطا" error="این فیلد الزامی است" htmlFor="f-err">
              <Input id="f-err" error defaultValue="" placeholder="…" />
            </Field>
            <Field label="انتخاب" htmlFor="f-sel">
              <Select id="f-sel" defaultValue="a">
                <option value="a">گزینه ۱</option>
                <option value="b">گزینه ۲</option>
              </Select>
            </Field>
            <div className="flex flex-col gap-3 pt-5">
              <Checkbox id="f-check" label="چک‌باکس" defaultChecked />
              <Radio id="f-radio" name="demo" label="رادیو" defaultChecked />
              <Toggle checked={toggleOn} onChange={setToggleOn} label="سوییچ" />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Status & feedback">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="neutral" label="خنثی" />
            <StatusBadge tone="success" label="موفق" />
            <StatusBadge tone="warning" label="هشدار" />
            <StatusBadge tone="error" label="خطا" />
            <StatusBadge tone="info" label="اطلاع" pulse />
            <StatusBadge tone="accent" label="فعال" />
          </div>
          <InlineMessage tone="warning">Semantic warning — جدا از Route identity.</InlineMessage>
          <Toast
            tone="success"
            title="ذخیره شد"
            body={
              <>
                شناسه نمونه: <LtrData>a1b2c3d4-uuid</LtrData>
              </>
            }
          />
        </div>
      </Panel>

      <Panel title="Table grammar">
        <table className="data-table">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>وضعیت</th>
              <th>مقدار فنی</th>
            </tr>
          </thead>
          <tbody>
            <tr className="row-normal">
              <td>ردیف عادی</td>
              <td>
                <StatusBadge tone="success" label="آماده" />
              </td>
              <td>
                <LtrData>35.6892, 51.3890</LtrData>
              </td>
            </tr>
            <tr className="row-selected">
              <td>ردیف انتخاب‌شده</td>
              <td>
                <StatusBadge tone="accent" label="انتخاب" />
              </td>
              <td>
                <LtrData>task-001</LtrData>
              </td>
            </tr>
            <tr className="row-warning">
              <td>ردیف هشدار</td>
              <td>
                <StatusBadge tone="warning" label="هشدار" />
              </td>
              <td>
                <LtrData>0.0000, 0.0000</LtrData>
              </td>
            </tr>
            <tr className="row-error">
              <td>ردیف خطا</td>
              <td>
                <StatusBadge tone="error" label="خطا" />
              </td>
              <td>
                <LtrData>—</LtrData>
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <InlineMessage tone="info">
        Demo statusهای Foundation (draft/ready/…) به‌عنوان Domain Enum وارد نشدند. Mapping بعداً از
        OpenAPI انجام می‌شود.
      </InlineMessage>
    </section>
  );
}
