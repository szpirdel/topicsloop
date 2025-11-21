"""
Django management command to create MVP category structure
Creates 156 categories: 12 L1 + 36 L2 + 108 L3 (3 levels deep)

Usage:
    python manage.py create_mvp_categories
    python manage.py create_mvp_categories --dry-run  # Preview without saving
"""

from django.core.management.base import BaseCommand
from blog.models import Category


# MVP Category Structure - 3 Levels Deep
MVP_CATEGORIES = [
    # ============================================================
    # 1. COMPUTER SCIENCE & TECHNOLOGY
    # ============================================================
    {
        "name": "Computer Science & Technology",
        "description": "Computing, software, and digital technologies",
        "color": "#667eea",
        "icon": "💻",
        "children": [
            {
                "name": "Artificial Intelligence",
                "description": "Machine learning, neural networks, and intelligent systems",
                "children": [
                    {"name": "Machine Learning", "description": "Algorithms that learn from data"},
                    {"name": "Natural Language Processing", "description": "Text and language understanding"},
                    {"name": "Computer Vision", "description": "Image and video analysis"},
                ]
            },
            {
                "name": "Software Engineering",
                "description": "Building and maintaining software systems",
                "children": [
                    {"name": "Web Development", "description": "Frontend, backend, and full-stack web apps"},
                    {"name": "Mobile Development", "description": "iOS, Android, and cross-platform apps"},
                    {"name": "DevOps & Cloud", "description": "CI/CD, containers, and cloud platforms"},
                ]
            },
            {
                "name": "Data Science",
                "description": "Extracting insights from data",
                "children": [
                    {"name": "Data Analysis", "description": "Statistical analysis and visualization"},
                    {"name": "Big Data", "description": "Large-scale data processing"},
                    {"name": "Business Intelligence", "description": "Data-driven decision making"},
                ]
            },
        ]
    },

    # ============================================================
    # 2. LIFE SCIENCES & MEDICINE
    # ============================================================
    {
        "name": "Life Sciences & Medicine",
        "description": "Biology, medicine, and health sciences",
        "color": "#48bb78",
        "icon": "🧬",
        "children": [
            {
                "name": "Biology",
                "description": "Study of living organisms",
                "children": [
                    {"name": "Molecular Biology", "description": "DNA, RNA, and proteins"},
                    {"name": "Genetics", "description": "Heredity and gene expression"},
                    {"name": "Ecology", "description": "Organisms and their environment"},
                ]
            },
            {
                "name": "Medicine",
                "description": "Healthcare and medical research",
                "children": [
                    {"name": "Clinical Research", "description": "Medical trials and evidence-based medicine"},
                    {"name": "Public Health", "description": "Population health and disease prevention"},
                    {"name": "Pharmacology", "description": "Drug discovery and therapeutics"},
                ]
            },
            {
                "name": "Neuroscience",
                "description": "Brain and nervous system research",
                "children": [
                    {"name": "Cognitive Neuroscience", "description": "Memory, learning, and cognition"},
                    {"name": "Neuroimaging", "description": "Brain imaging techniques"},
                    {"name": "Behavioral Neuroscience", "description": "Behavior and neural mechanisms"},
                ]
            },
        ]
    },

    # ============================================================
    # 3. PHYSICAL SCIENCES
    # ============================================================
    {
        "name": "Physical Sciences",
        "description": "Physics, chemistry, and earth sciences",
        "color": "#ed8936",
        "icon": "⚛️",
        "children": [
            {
                "name": "Physics",
                "description": "Matter, energy, and fundamental forces",
                "children": [
                    {"name": "Quantum Physics", "description": "Quantum mechanics and computing"},
                    {"name": "Astrophysics", "description": "Stars, galaxies, and cosmology"},
                    {"name": "Particle Physics", "description": "Subatomic particles and forces"},
                ]
            },
            {
                "name": "Chemistry",
                "description": "Chemical reactions and molecular structures",
                "children": [
                    {"name": "Organic Chemistry", "description": "Carbon-based compounds"},
                    {"name": "Inorganic Chemistry", "description": "Non-carbon compounds and catalysis"},
                    {"name": "Physical Chemistry", "description": "Thermodynamics and kinetics"},
                ]
            },
            {
                "name": "Earth Sciences",
                "description": "Geology, climate, and oceans",
                "children": [
                    {"name": "Geology", "description": "Rocks, minerals, and plate tectonics"},
                    {"name": "Climate Science", "description": "Climate modeling and change"},
                    {"name": "Oceanography", "description": "Ocean systems and marine life"},
                ]
            },
        ]
    },

    # ============================================================
    # 4. MATHEMATICS & STATISTICS
    # ============================================================
    {
        "name": "Mathematics & Statistics",
        "description": "Pure and applied mathematics, statistical methods",
        "color": "#9f7aea",
        "icon": "📐",
        "children": [
            {
                "name": "Pure Mathematics",
                "description": "Abstract mathematical theory",
                "children": [
                    {"name": "Algebra", "description": "Linear and abstract algebra"},
                    {"name": "Geometry", "description": "Shapes, spaces, and topology"},
                    {"name": "Number Theory", "description": "Properties of numbers"},
                ]
            },
            {
                "name": "Applied Mathematics",
                "description": "Mathematical methods for real-world problems",
                "children": [
                    {"name": "Optimization", "description": "Finding optimal solutions"},
                    {"name": "Computational Math", "description": "Numerical methods and algorithms"},
                    {"name": "Mathematical Modeling", "description": "Modeling physical systems"},
                ]
            },
            {
                "name": "Statistics",
                "description": "Data collection, analysis, and inference",
                "children": [
                    {"name": "Bayesian Statistics", "description": "Probabilistic inference"},
                    {"name": "Time Series Analysis", "description": "Temporal data analysis"},
                    {"name": "Experimental Design", "description": "A/B testing and sampling"},
                ]
            },
        ]
    },

    # ============================================================
    # 5. ENGINEERING
    # ============================================================
    {
        "name": "Engineering",
        "description": "Electrical, mechanical, and civil engineering",
        "color": "#f56565",
        "icon": "⚙️",
        "children": [
            {
                "name": "Electrical Engineering",
                "description": "Circuits, signals, and power systems",
                "children": [
                    {"name": "Circuit Design", "description": "Analog and digital circuits"},
                    {"name": "Signal Processing", "description": "Audio, image, and video processing"},
                    {"name": "Power Systems", "description": "Energy generation and distribution"},
                ]
            },
            {
                "name": "Mechanical Engineering",
                "description": "Machines, thermodynamics, and materials",
                "children": [
                    {"name": "Thermodynamics", "description": "Heat transfer and energy"},
                    {"name": "Robotics", "description": "Robot design and control"},
                    {"name": "Materials Science", "description": "Material properties and applications"},
                ]
            },
            {
                "name": "Civil Engineering",
                "description": "Infrastructure and built environment",
                "children": [
                    {"name": "Structural Engineering", "description": "Buildings and bridges"},
                    {"name": "Transportation", "description": "Roads, traffic, and transit"},
                    {"name": "Environmental Engineering", "description": "Water and waste management"},
                ]
            },
        ]
    },

    # ============================================================
    # 6. SOCIAL SCIENCES
    # ============================================================
    {
        "name": "Social Sciences",
        "description": "Psychology, economics, and sociology",
        "color": "#4299e1",
        "icon": "🧠",
        "children": [
            {
                "name": "Psychology",
                "description": "Human behavior and mental processes",
                "children": [
                    {"name": "Cognitive Psychology", "description": "Memory, perception, and thinking"},
                    {"name": "Social Psychology", "description": "Group behavior and influence"},
                    {"name": "Clinical Psychology", "description": "Mental health and therapy"},
                ]
            },
            {
                "name": "Economics",
                "description": "Production, distribution, and consumption",
                "children": [
                    {"name": "Microeconomics", "description": "Individual and firm behavior"},
                    {"name": "Macroeconomics", "description": "National and global economies"},
                    {"name": "Behavioral Economics", "description": "Psychology and economic decisions"},
                ]
            },
            {
                "name": "Sociology",
                "description": "Social structures and relationships",
                "children": [
                    {"name": "Urban Sociology", "description": "Cities and urbanization"},
                    {"name": "Cultural Studies", "description": "Culture and identity"},
                    {"name": "Social Networks", "description": "Network analysis and communities"},
                ]
            },
        ]
    },

    # ============================================================
    # 7. BUSINESS & MANAGEMENT
    # ============================================================
    {
        "name": "Business & Management",
        "description": "Strategy, marketing, and operations",
        "color": "#38b2ac",
        "icon": "💼",
        "children": [
            {
                "name": "Business Strategy",
                "description": "Competitive advantage and innovation",
                "children": [
                    {"name": "Innovation", "description": "New products and business models"},
                    {"name": "Competitive Analysis", "description": "Market positioning and strategy"},
                    {"name": "Business Models", "description": "Revenue and value creation"},
                ]
            },
            {
                "name": "Marketing",
                "description": "Customer acquisition and retention",
                "children": [
                    {"name": "Digital Marketing", "description": "SEO, SEM, and social media"},
                    {"name": "Consumer Behavior", "description": "Purchase decisions and psychology"},
                    {"name": "Brand Management", "description": "Brand identity and equity"},
                ]
            },
            {
                "name": "Operations",
                "description": "Process efficiency and quality",
                "children": [
                    {"name": "Supply Chain", "description": "Logistics and inventory"},
                    {"name": "Quality Management", "description": "Six Sigma and TQM"},
                    {"name": "Project Management", "description": "Agile, Scrum, and planning"},
                ]
            },
        ]
    },

    # ============================================================
    # 8. ENVIRONMENTAL SCIENCES
    # ============================================================
    {
        "name": "Environmental Sciences",
        "description": "Climate, sustainability, and conservation",
        "color": "#68d391",
        "icon": "🌍",
        "children": [
            {
                "name": "Climate Change",
                "description": "Climate science and policy",
                "children": [
                    {"name": "Climate Modeling", "description": "Predicting climate futures"},
                    {"name": "Mitigation", "description": "Reducing emissions"},
                    {"name": "Adaptation", "description": "Preparing for climate impacts"},
                ]
            },
            {
                "name": "Sustainability",
                "description": "Sustainable development and technology",
                "children": [
                    {"name": "Renewable Energy", "description": "Solar, wind, and hydro"},
                    {"name": "Circular Economy", "description": "Waste reduction and recycling"},
                    {"name": "Green Technology", "description": "Clean tech and innovation"},
                ]
            },
            {
                "name": "Conservation",
                "description": "Protecting ecosystems and species",
                "children": [
                    {"name": "Biodiversity", "description": "Species and genetic diversity"},
                    {"name": "Ecosystem Management", "description": "Forest and wetland conservation"},
                    {"name": "Wildlife Protection", "description": "Endangered species"},
                ]
            },
        ]
    },

    # ============================================================
    # 9. HEALTH & POLICY
    # ============================================================
    {
        "name": "Health & Policy",
        "description": "Healthcare systems and public policy",
        "color": "#fc8181",
        "icon": "🏥",
        "children": [
            {
                "name": "Healthcare Systems",
                "description": "Healthcare delivery and economics",
                "children": [
                    {"name": "Healthcare Economics", "description": "Cost-effectiveness and pricing"},
                    {"name": "Healthcare Technology", "description": "EHR, telemedicine, and devices"},
                    {"name": "Access & Equity", "description": "Universal healthcare and disparities"},
                ]
            },
            {
                "name": "Public Policy",
                "description": "Government policy and regulation",
                "children": [
                    {"name": "Education Policy", "description": "School funding and curriculum"},
                    {"name": "Environmental Policy", "description": "Pollution and conservation laws"},
                    {"name": "Economic Policy", "description": "Tax, trade, and labor policy"},
                ]
            },
            {
                "name": "Global Health",
                "description": "Worldwide health challenges",
                "children": [
                    {"name": "Epidemiology", "description": "Disease surveillance and outbreaks"},
                    {"name": "Disease Prevention", "description": "Vaccination and screening"},
                    {"name": "Health Equity", "description": "Reducing global health disparities"},
                ]
            },
        ]
    },

    # ============================================================
    # 10. ARTS & HUMANITIES
    # ============================================================
    {
        "name": "Arts & Humanities",
        "description": "Philosophy, history, and linguistics",
        "color": "#d69e2e",
        "icon": "🎨",
        "children": [
            {
                "name": "Philosophy",
                "description": "Ethics, logic, and metaphysics",
                "children": [
                    {"name": "Ethics", "description": "Moral philosophy and bioethics"},
                    {"name": "Logic", "description": "Formal logic and reasoning"},
                    {"name": "Metaphysics", "description": "Reality, existence, and mind"},
                ]
            },
            {
                "name": "History",
                "description": "Historical research and analysis",
                "children": [
                    {"name": "Modern History", "description": "20th-21st century history"},
                    {"name": "Ancient History", "description": "Greece, Rome, and Egypt"},
                    {"name": "History of Science", "description": "Scientific development"},
                ]
            },
            {
                "name": "Linguistics",
                "description": "Language structure and use",
                "children": [
                    {"name": "Computational Linguistics", "description": "NLP and language models"},
                    {"name": "Sociolinguistics", "description": "Language and society"},
                    {"name": "Language Acquisition", "description": "Learning first and second languages"},
                ]
            },
        ]
    },

    # ============================================================
    # 11. AUTOMOTIVE & TRANSPORTATION (POPULAR!)
    # ============================================================
    {
        "name": "Automotive & Transportation",
        "description": "Electric vehicles, self-driving, and future mobility",
        "color": "#805ad5",
        "icon": "🚗",
        "children": [
            {
                "name": "Electric Vehicles",
                "description": "EVs, batteries, and charging",
                "children": [
                    {"name": "EV Technology", "description": "Batteries, motors, and drivetrains"},
                    {"name": "EV Manufacturers", "description": "Tesla, Rivian, and traditional OEMs"},
                    {"name": "EV Market & Policy", "description": "Adoption trends and incentives"},
                ]
            },
            {
                "name": "Autonomous Vehicles",
                "description": "Self-driving cars and AI",
                "children": [
                    {"name": "Self-Driving Tech", "description": "Sensors, AI, and V2X"},
                    {"name": "AV Companies", "description": "Waymo, Cruise, and Tesla FSD"},
                    {"name": "AV Regulation", "description": "Safety testing and liability"},
                ]
            },
            {
                "name": "Transportation Systems",
                "description": "Public transit and future mobility",
                "children": [
                    {"name": "Public Transit", "description": "Buses, metro, and light rail"},
                    {"name": "Mobility as a Service", "description": "Ride-sharing and car-sharing"},
                    {"name": "Future of Transportation", "description": "Hyperloop, eVTOL, and flying cars"},
                ]
            },
        ]
    },

    # ============================================================
    # 12. SPORTS & ATHLETICS (POPULAR!)
    # ============================================================
    {
        "name": "Sports & Athletics",
        "description": "Sports science, analytics, and performance",
        "color": "#f687b3",
        "icon": "⚽",
        "children": [
            {
                "name": "Sports Science",
                "description": "Physiology, biomechanics, and nutrition",
                "children": [
                    {"name": "Exercise Physiology", "description": "VO2 max and endurance"},
                    {"name": "Biomechanics", "description": "Movement analysis and injury prevention"},
                    {"name": "Sports Nutrition", "description": "Diet, supplements, and hydration"},
                ]
            },
            {
                "name": "Sports Analytics",
                "description": "Data-driven performance analysis",
                "children": [
                    {"name": "Performance Analytics", "description": "Player tracking and wearables"},
                    {"name": "Team Analytics", "description": "Sabermetrics and expected goals"},
                    {"name": "Predictive Modeling", "description": "Injury prediction and outcomes"},
                ]
            },
            {
                "name": "Training & Medicine",
                "description": "Coaching, training, and rehabilitation",
                "children": [
                    {"name": "Strength & Conditioning", "description": "Periodization and weightlifting"},
                    {"name": "Injury Management", "description": "Rehab and return-to-play"},
                    {"name": "Sports Psychology", "description": "Mental training and motivation"},
                ]
            },
        ]
    },
]


class Command(BaseCommand):
    help = 'Create MVP category structure (156 categories, 3 levels deep)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview categories without creating them',
        )
        parser.add_argument(
            '--delete-existing',
            action='store_true',
            help='Delete all existing categories before creating new ones',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        delete_existing = options['delete_existing']

        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN - No changes will be made'))

        # Delete existing categories if requested
        if delete_existing and not dry_run:
            count = Category.objects.count()
            if count > 0:
                self.stdout.write(f'🗑️  Deleting {count} existing categories...')
                Category.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'✅ Deleted {count} categories'))

        # Create categories
        total_created = 0
        stats = {'L1': 0, 'L2': 0, 'L3': 0}

        for l1_data in MVP_CATEGORIES:
            # Create L1 category
            l1_name = l1_data['name']

            if dry_run:
                self.stdout.write(f'\n📁 {l1_data["icon"]} {l1_name} (L1)')
            else:
                l1_cat, created = Category.objects.get_or_create(
                    name=l1_name,
                    parent=None,
                    defaults={
                        'description': l1_data.get('description', ''),
                        'level': 1,
                    }
                )
                if created:
                    total_created += 1
                    stats['L1'] += 1
                    self.stdout.write(f'\n✅ Created L1: {l1_name}')
                else:
                    self.stdout.write(f'\n⏭️  L1 exists: {l1_name}')

            # Create L2 categories
            for l2_data in l1_data.get('children', []):
                l2_name = l2_data['name']

                if dry_run:
                    self.stdout.write(f'  ├─ {l2_name} (L2)')
                else:
                    l2_cat, created = Category.objects.get_or_create(
                        name=l2_name,
                        parent=l1_cat,
                        defaults={
                            'description': l2_data.get('description', ''),
                            'level': 2,
                        }
                    )
                    if created:
                        total_created += 1
                        stats['L2'] += 1
                        self.stdout.write(f'  ✅ Created L2: {l2_name}')

                # Create L3 categories
                for l3_data in l2_data.get('children', []):
                    l3_name = l3_data['name']

                    if dry_run:
                        self.stdout.write(f'    ├─ {l3_name} (L3)')
                    else:
                        l3_cat, created = Category.objects.get_or_create(
                            name=l3_name,
                            parent=l2_cat,
                            defaults={
                                'description': l3_data.get('description', ''),
                                'level': 3,
                            }
                        )
                        if created:
                            total_created += 1
                            stats['L3'] += 1
                            self.stdout.write(f'    ✅ Created L3: {l3_name}')

        # Summary
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN COMPLETE - No changes made'))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n🎉 SUCCESS! Created {total_created} categories'))

        self.stdout.write(f'\n📊 Category Statistics:')
        self.stdout.write(f'   L1 (Main): {stats["L1"]} categories')
        self.stdout.write(f'   L2 (Domains): {stats["L2"]} categories')
        self.stdout.write(f'   L3 (Topics): {stats["L3"]} categories')
        self.stdout.write(f'   TOTAL: {sum(stats.values())} categories')
        self.stdout.write(f'\n✅ MVP category structure ready!\n')
