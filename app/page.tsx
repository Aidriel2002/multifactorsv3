'use client';

import React, { useState, useEffect } from 'react';
import { Users, Zap, Shield, ArrowRight, Github, Linkedin, Mail, Phone, MapPin, Facebook } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Image from "next/image";
import customer1 from "@/public/customer1.jpg";
import logo from "@/public/logo.png"
import Hero from '@/app/components/Hero';
import LoginPage from '@/app/auth/login/page';
import Modal from '@/app/components/Modal'


// About Section Component
const About = () => {
  const features = [
    { icon: <Zap className="w-8 h-8" />, title: "Lightning Fast", description: "Optimized for speed and performance" },
    { icon: <Shield className="w-8 h-8" />, title: "Secure", description: "Built with security as a top priority" },
    { icon: <Users className="w-8 h-8" />, title: "Collaborative", description: "Work together seamlessly" }
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">About Our Mission</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;re dedicated to creating exceptional digital experiences that push the boundaries of what&apos;s possible
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Innovation at Its Core</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Our team combines creativity with technical expertise to deliver solutions that not only meet your needs but exceed your expectations. We believe in the power of technology to transform businesses and lives.
            </p>
            <p className="text-gray-600 leading-relaxed">
              From concept to completion, we&apos;re committed to excellence in every project we undertake. Our passion for innovation drives us to explore new possibilities and create meaningful impact.
            </p>
          </div>
          
          <div className="relative">
      <div className="aspect-square bg-[#0FA34A] hover:bg-[#0C8A3E] rounded-3xl shadow-2xl transform rotate-6 hover:rotate-3 transition-transform duration-500"></div>
      <div className="absolute inset-4 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center">
        <Image
          src={customer1}
          alt="customer image"
          fill
          priority
          className="object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-white/70 rounded-2xl"></div>
        <div className="relative text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
          <div className="text-gray-700">Projects Completed</div>
        </div>
      </div>
    </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl mb-6 group-hover:scale-110 transform transition-transform duration-300">
                {feature.icon}
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Projects Section Component
const Projects = () => {
  const projects = [
    {
      title: "E-Commerce Platform",
      description: "Modern online shopping experience with advanced features",
      tech: ["React", "Node.js", "MongoDB"],
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "AI Dashboard",
      description: "Intelligent analytics and insights platform",
      tech: ["Vue.js", "Python", "TensorFlow"],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Mobile App",
      description: "Cross-platform mobile application with native performance",
      tech: ["React Native", "Firebase", "Redux"],
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Blockchain Solution",
      description: "Decentralized application for secure transactions",
      tech: ["Solidity", "Web3.js", "Ethereum"],
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      title: "IoT Platform",
      description: "Connected devices management and monitoring",
      tech: ["Arduino", "Raspberry Pi", "AWS IoT"],
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "AR Experience",
      description: "Immersive augmented reality application",
      tech: ["Unity", "ARCore", "C#"],
      gradient: "from-teal-500 to-blue-500"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Projects</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our portfolio of innovative solutions across various industries and technologies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                <div className={`h-48 bg-gradient-to-br ${project.gradient} relative`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, i) => (
                        <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                    <span className="mr-2">View Details</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Contact Section Component
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/sendEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (result.success) {
      alert("✅ Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
      console.log(result);
    } else {
      alert("❌ Failed to send message. Try again later.");
    }
  } catch (err) {
    console.error(err);
    alert("⚠️ Something went wrong.");
  }
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to start your next project? Let&apos;s discuss how we can bring your vision to life
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
            
            <div className="space-y-6">
  {/* Email */}
  <a 
    href="mailto:multifactorssales@gmail.com" 
    className="flex items-center hover:opacity-80 transition"
  >
    <div className="w-12 h-12 bg-[#0FA34A] text-white rounded-full flex items-center justify-center mr-4">
      <Mail size={20} />
    </div>
    <div>
      <div className="font-semibold text-gray-900">Email</div>
      <div className="text-gray-600">multifactorssales@gmail.com</div>
    </div>
  </a>

  {/* Phone */}
  <a 
    href="tel:09177113478" 
    className="flex items-center hover:opacity-80 transition"
  >
    <div className="w-12 h-12 bg-[#0FA34A] text-white rounded-full flex items-center justify-center mr-4">
      <Phone size={20} />
    </div>
    <div>
      <div className="font-semibold text-gray-900">Phone</div>
      <div className="text-gray-600">09177113478</div>
    </div>
  </a>

  {/* Location */}
  <a 
    href="https://www.google.com/maps/place/Multifactors+Sales/@8.2239033,124.250122,17.25z/data=!4m15!1m8!3m7!1s0x3255760e8f444543:0x7412e2e7a2c8016f!2sCrown+Paper+and+Stationery+Warehouse,+Iligan+City,+9200+Lanao+del+Norte!3b1!8m2!3d8.2238923!4d124.2501049!16s%2Fg%2F11b6_8khds!3m5!1s0x3255779c251b23cf:0x3a684bd25b753962!8m2!3d8.224544!4d124.25048!16s%2Fg%2F11s1817vdx?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D" 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center hover:opacity-80 transition"
  >
    <div className="w-12 h-12 bg-[#0FA34A] text-white rounded-full flex items-center justify-center mr-4">
      <MapPin size={20} />
    </div>
    <div>
      <div className="font-semibold text-gray-900">Location</div>
      <div className="text-gray-600">
        No. 0005 Juan C. Legaspi Street, Ubaldo D. Laya 9200 Iligan City, Philippines
      </div>
    </div>
  </a>
</div>


            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                {[Github, Facebook, Linkedin].map((Icon, index) => (
                  <a key={index} href="#" className="w-10 h-10 bg-gray-200 hover:bg-blue-600 text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110">
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your Name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your Email"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter your message..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0FA34A] cursor-pointer text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-[#042F01] to-[#055B00] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Image 
        src={logo} 
        alt="Multifactors Logo" 
        width={200} 
        height={200} 
        priority
      />
            <p className="text-gray-400 mb-4 mt-4">
              Creating exceptional digital experiences that inspire and innovate.
            </p>
            <div className="flex space-x-4">
              {[Github, Facebook, Linkedin].map((Icon, index) => (
                <a key={index} href="#" className="text-gray-400 hover:text-white transition-colors duration-200 ">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#about" className="hover:text-white transition-colors duration-200">About</a></li>
              <li><a href="#projects" className="hover:text-white transition-colors duration-200">Projects</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors duration-200">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Web Development</li>
              <li>Mobile Apps</li>
              <li>UI/UX Design</li>
              <li>Consulting</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-400 mb-4">Stay updated with our latest projects and insights.</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Multifactors Sales. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  
 const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />
      <Hero onLoginClick={() => setIsLoginOpen(true)}/>
      <About />
      <Projects />
      <Contact />
      <Footer />


      {/* Modal with login form */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)}>
        <LoginPage />
      </Modal>
    </main>
  );
}