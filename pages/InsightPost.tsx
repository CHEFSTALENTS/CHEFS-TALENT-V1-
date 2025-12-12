import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Section, Reveal, Marker, Button, Label, Badge } from '../components/ui';
import { articles } from '../data/articles';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const InsightPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = articles.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | Chef Talents Insights`;
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper">
        <h1 className="text-4xl font-serif mb-4">Article introuvable</h1>
        <Button onClick={() => navigate('/insights')}>Retour au Journal</Button>
      </div>
    );
  }

  return (
    <article className="bg-paper min-h-screen pt-32 pb-24">
      {/* Editorial Header */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto text-center mb-24">
        <Reveal>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Link to="/insights" className="text-xs uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 transition-colors">
              Journal
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-xs uppercase tracking-[0.2em] text-stone-900">{article.category}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.1] mb-8">
            {article.title}
          </h1>
          <p className="text-xl md:text-2xl text-stone-500 font-light leading-relaxed max-w-2xl mx-auto">
            {article.subtitle}
          </p>
        </Reveal>
      </section>

      {/* Hero Image */}
      <Reveal delay={0.2} className="px-6 md:px-12 max-w-[100rem] mx-auto mb-24">
        <div className="aspect-[21/9] w-full overflow-hidden bg-stone-200">
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-[2s] ease-in-out"
          />
        </div>
      </Reveal>

      {/* Content Body */}
      <Section className="py-0 md:py-0">
        <div className="max-w-2xl mx-auto">
          {article.blocks.map((block, index) => {
            switch (block.type) {
              case 'paragraph':
                return (
                  <Reveal key={index} delay={0.1}>
                    <p className="text-lg md:text-xl text-stone-600 font-light leading-relaxed mb-8">
                      {block.content}
                    </p>
                  </Reveal>
                );
              case 'h2':
                return (
                  <Reveal key={index} delay={0.1} className="mt-16 mb-8">
                    <Marker className="h-8 mb-6" />
                    <h2 className="text-3xl md:text-4xl font-serif text-stone-900">
                      {block.content}
                    </h2>
                  </Reveal>
                );
              case 'h3':
                return (
                  <Reveal key={index} delay={0.1}>
                    <h3 className="text-2xl font-serif text-stone-800 mt-12 mb-6">
                      {block.content}
                    </h3>
                  </Reveal>
                );
              case 'list':
                return (
                  <Reveal key={index} delay={0.1}>
                    <ul className="mb-12 space-y-4 border-t border-b border-stone-200 py-8 my-8">
                      {(block.content as string[]).map((item, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <span className="text-stone-300 font-serif italic">{i + 1}.</span>
                          <span className="text-stone-700 font-light text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                );
              case 'quote':
                return (
                  <Reveal key={index} delay={0.1}>
                    <blockquote className="my-16 pl-8 border-l-2 border-stone-900">
                      <p className="text-2xl md:text-3xl font-serif text-stone-900 italic leading-tight">
                        "{block.content}"
                      </p>
                    </blockquote>
                  </Reveal>
                );
              default:
                return null;
            }
          })}
        </div>
      </Section>

      {/* Footer / Next Action */}
      <section className="bg-stone-50 py-32 mt-32 px-6 text-center border-t border-stone-200">
        <Reveal>
          <Label className="mb-8">Étape suivante</Label>
          <h2 className="text-4xl md:text-5xl font-serif text-stone-900 mb-12">
            Élevez vos standards.
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/insights">
              <Button variant="outline" className="w-48"><ArrowLeft className="mr-4 w-4 h-4"/> Journal</Button>
            </Link>
            <Link to={article.relatedLink}>
              <Button className="w-64 bg-stone-900 text-white">{article.relatedLinkText}</Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </article>
  );
};

export default InsightPost;