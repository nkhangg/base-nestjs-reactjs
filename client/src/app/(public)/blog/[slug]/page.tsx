export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-muted-foreground">Slug: {params.slug}</p>
      {/* BlogPostPage component will be implemented in blog module */}
    </div>
  )
}
