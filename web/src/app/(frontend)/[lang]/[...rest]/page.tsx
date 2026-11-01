import { notFound } from 'next/navigation'

/** Tanınmayan her adres sitenin kendi 404 sayfasına düşsün */
export default function CatchAll() {
  notFound()
}
